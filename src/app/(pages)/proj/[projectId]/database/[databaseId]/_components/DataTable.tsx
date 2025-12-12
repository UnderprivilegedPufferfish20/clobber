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

  // Compute row count from the longest column
  const rowCount = React.useMemo(() => {
    const lengths = columnKeys.map((key) => data[key]?.length ?? 0);
    return lengths.length === 0 ? 0 : Math.max(...lengths);
  }, [columnKeys, data]);

  if (columns.length === 0 || rowCount === 0) {
    return (
      <div className="text-sm text-muted-foreground px-2 py-4">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table className="h-full min-h-full max-h-full">
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label ?? col.key}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="h-full min-h-full max-h-full">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <TableRow key={getRowKey?.(rowIndex) ?? rowIndex}>
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
  );
}
