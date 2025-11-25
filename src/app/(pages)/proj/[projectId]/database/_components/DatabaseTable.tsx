"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  ChevronsUpDown,
  InboxIcon,
  CopyIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CreateDatabaseDialog from "./CreateDatabaseDialog";
import { redirect } from "next/navigation";

export type CustomDataTableProps = {
  data: {
    "Name": string[];
    "ID": string[];
    "Created At": string[];
    "Size (GB)": string[];
  };
  projectId: string
};

type RowData = {
  "Name": string;
  "ID": string;
  "Created At": string;
  "Size (GB)": string;
};

/** Convert columnar data to row objects */
function materializeRows(columnar: CustomDataTableProps["data"]): RowData[] {
  const keys = ["Name", "ID", "Created At", "Size (GB)"] as const;
  
  // Check that all arrays exist and have the same length
  const lengths = keys.map((k) => {
    const arr = columnar[k];
    if (!Array.isArray(arr)) throw new Error(`Data for column "${k}" must be an array`);
    return arr.length;
  });
  
  const uniqueLens = new Set(lengths);
  if (uniqueLens.size > 1) {
    throw new Error(`All data arrays must have the same length. Got lengths: ${keys.map((k, i) => `${k}=${lengths[i]}`).join(", ")}`);
  }

  const rowCount = lengths[0] ?? 0;
  
  // Turn into row objects
  return Array.from({ length: rowCount }, (_, r) => ({
    "Name": columnar["Name"][r] ?? "",
    "ID": columnar["ID"][r] ?? "",
    "Created At": columnar["Created At"][r] ?? "",
    "Size (GB)": columnar["Size (GB)"][r] ?? "",
  }));
}

// Cell renderer for text values
function CellRenderer({ value }: { value: unknown }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return <span>{String(value)}</span>;
}

export default function CustomDataTable({ data: columnar, projectId }: CustomDataTableProps) {
  const columnKeys = ["Name", "ID", "Created At", "Size (GB)"] as const;

  // Build tanstack columns
  const columns = useMemo<ColumnDef<RowData>[]>(() => {
    return columnKeys.map((key) => ({
      id: key,
      accessorKey: key,
      header: key,
      size: key === "Name" ? 260 : 160,
      cell: ({ getValue }) => <CellRenderer value={getValue()} />,
      enableSorting: true,
    }));
  }, []);

  // Validate + materialize rows
  const baseRows = useMemo(() => {
    if (!columnar) return [] as RowData[];
    try {
      return materializeRows(columnar);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error("CustomDataTable validation error:", e);
      return [] as RowData[];
    }
  }, [columnar]);
  
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchBy, setSearchBy] = useState<"Name" | "ID">("Name");
  // Filter rows based on search

  const filteredRows = useMemo(() => {
    if (!searchValue.trim()) return baseRows;
    const searchLower = searchValue.toLowerCase();
    return baseRows.filter((row) => {
      const fieldValue = row[searchBy];
      return fieldValue.toLowerCase().startsWith(searchLower);
    });
  }, [baseRows, searchValue, searchBy]);

  // Offset (pre-pagination)
  const [offset, setOffset] = useState<number>(0);
  const offsetRows = useMemo(() => filteredRows.slice(offset), [filteredRows, offset]);

  const [pageSize, setPageSize] = useState<number>(5);

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Search state

  const table = useReactTable({
    data: offsetRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  });

  // Adjust page size when controlled input changes
  useEffect(() => {
    table.setPageSize(Number(pageSize));
  }, [pageSize, table]);

  // Reset offset when search changes
  useEffect(() => {
    setOffset(0);
  }, [searchValue, searchBy]);

  const hasRows = table.getRowModel().rows.length > 0;

  const fullLength = baseRows.length

  return (
    <div className="min-w-full w-full max-w-full">
        <div className="flex items-center gap-3 mb-4 justify-between">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder={`Search by ${searchBy}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-[440px] p-6"
            />

            <div className="absolute -right-10 top-0 h-full flex items-center gap-2">
              <Button
                variant={searchBy === "Name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchBy("Name")}
              >
                Name
              </Button>
              <Button
                variant={searchBy === "ID" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchBy("ID")}
              >
                ID
              </Button>
            </div>
            {searchValue && (
              <div className="absolute top-1/4 -right-42 text-md text-muted-foreground">
                {table.getRowCount()} Results of {fullLength}
              </div>
            )}

          </div>

          <div className="flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setOffset((p) => Math.max(0, p - pageSize));
              }}
              disabled={offset === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    onBlur={(e) => {
                      const num = Number(e.target.value);
                      setPageSize(!e.target.value ? 1 : isNaN(num) ? 1 : Math.max(1, Math.min(500, num)));
                    }}
                    className="w-[52px] text-center"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Page Size</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    value={offset}
                    onChange={(e) => setOffset(Number(e.target.value))}
                    onBlur={(e) => {
                      const num = Number(e.target.value);
                      setOffset(!e.target.value ? 0 : isNaN(num) ? 0 : Math.max(0, num));
                    }}
                    className="w-[52px] text-center"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Offset</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setOffset((p) => p + pageSize);
              }}
              disabled={offset + pageSize >= filteredRows.length}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

      {/* Table */}
      <div className="rounded-md border">
        <ShadTable>
          <TableHeader className="flex-none">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="flex-none relative">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap bg-accent flex-none pl-8">
                    {header.isPlaceholder ? null : (
                      <div
                        className={`${header.column.getCanSort() ? "cursor-pointer select-none" : undefined} flex items-center`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="flex-none">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        <span className="inline-flex ml-2 w-5">
                          {{
                            asc: <ArrowUpNarrowWide size={20} />,
                            desc: <ArrowDownWideNarrow size={20} />,
                          }[header.column.getIsSorted() as string] ?? <ChevronsUpDown size={20} />}
                        </span>
                      </div>
                    )}
                  </TableHead>
                ))}
                <div className="text-muted-foreground absolute right-2 text-md top-1/4">
                  {fullLength} Rows
                </div>
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {!hasRows ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div>
                    {!searchValue ? (

                    <div className="flex flex-col gap-2 items-center justify-center m-4">
                      <InboxIcon size={106}/>
                      <h1 className="text-xl">No databases here yet.</h1>
                      <CreateDatabaseDialog
                        projectId={projectId}
                        triggerText="Start the First"
                      />
                    </div>
                    ) : (
                      <div className="text-xl flex flex-col gap-2 items-center justify-center m-4">
                        <h1 className="text-muted-foreground text-center mb-3">No results for "{searchValue}"</h1>
                        <Button
                          onClick={() => setSearchValue("")}
                          className="m-1/2"
                        >
                          Clear Filter
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="hover:cursor-pointer" 
                  key={row.id} 
                  onClick={() => redirect(`/proj/${projectId}/database/${row.getValue("ID")!}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="relative group pl-8">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const text = cell.getValue() as string;
                            navigator.clipboard.writeText(text?.toString() || '');
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-accent rounded absolute -left-1"
                          aria-label="Copy to clipboard"
                        >
                          <CopyIcon size={14} className="text-muted-foreground" />
                        </button>
                        <span className="flex-1">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadTable>
      </div>
    </div>
  );
}