import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnTableProps } from "@/lib/types";


export function DataTable<
  TColumns extends string,
  TData extends Record<TColumns, unknown[]>
>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No data to display.",
}: ColumnTableProps<TColumns, TData>) {
  const columnKeys = columns.map((c) => c.key);

  // Define the type for the row keys explicitly
  type RowKeyType = string | number;

  // Initialize state with the specific RowKeyType
  const [selectedRows, setSelectedRows] = React.useState<Set<RowKeyType>>(new Set());

  // Compute row count from the longest column
  const rowCount = React.useMemo(() => {
    const lengths = columnKeys.map((key) => data[key]?.length ?? 0);
    return lengths.length === 0 ? 0 : Math.max(...lengths);
  }, [columnKeys, data]);

  // Generate stable keys for all rows for selection management
  const allRowKeys = React.useMemo(() => {
    // Ensure the mapped keys conform to the expected type
    return Array.from({ length: rowCount }).map((_, rowIndex) => 
        (getRowKey?.(rowIndex) ?? rowIndex) as RowKeyType
    );
  }, [rowCount, getRowKey]);


  if (columns.length === 0 || rowCount === 0) {
    return (
      <div className="text-sm text-muted-foreground px-2 py-4 h-full">
        {emptyMessage}
      </div>
    );
  }
  
  // Selection Logic Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Assign all valid row keys to the Set
      setSelectedRows(new Set(allRowKeys));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowIndex: RowKeyType, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(rowIndex);
      } else {
        newSelection.delete(rowIndex);
      }
      return newSelection;
    });
  };

  const isAllSelected = selectedRows.size === rowCount && rowCount > 0;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < rowCount;

  return (
    // Outer div made scrollable and given full height
    <div className="h-full w-full overflow-auto"> 
        {/* Table uses w-full to take full horizontal space */}
      <Table className="w-full">
        {/* Header styling: bg-gray-100 makes it lighter than the default white rows */}
        <TableHeader className="bg-gray-100 dark:bg-gray-800/50 sticky top-0 z-10">
          <TableRow>
            {/* Select All Checkbox */}
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected || isIndeterminate ? "indeterminate" : isAllSelected}
                // We assert the incoming type is boolean | "indeterminate", which Checkbox expects
                onCheckedChange={(value) => handleSelectAll(!!value)} 
                aria-label="Select all rows"
              />
            </TableHead>
            
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label ?? col.key}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {allRowKeys.map((rowKey, rowIndex) => (
            <TableRow 
                key={rowKey} 
                // Highlights selected rows slightly
                className={selectedRows.has(rowKey) ? "bg-gray-50 dark:bg-gray-700/50" : ""}
            >
              {/* Individual Row Checkbox */}
              <TableCell>
                <Checkbox
                  checked={selectedRows.has(rowKey)}
                  onCheckedChange={(checkedState) => 
                    // We assert the incoming type is boolean | "indeterminate"
                    handleSelectRow(rowKey, !!checkedState)
                  }
                  aria-label={`Select row ${rowIndex + 1}`}
                />
              </TableCell>

              {columns.map((col) => {
                const colArray = data[col.key];
                const value =
                  Array.isArray(colArray) && rowIndex < colArray.length
                    ? colArray[rowIndex]
                    : undefined;

                return (
                  <TableCell key={col.key}>
                    {col.render
                      ? col.render({
                          value,
                          rowIndex,
                          columnKey: col.key,
                        })
                      : value === undefined || value === null
                      ? ""
                      : String(value)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
