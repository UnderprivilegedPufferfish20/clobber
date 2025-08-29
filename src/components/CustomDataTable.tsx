"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ArrowUpDown, InboxIcon } from "lucide-react";
import CreateDatabaseDialog from "@/app/(pages)/proj/[projectId]/database/_components/CreateDatabaseDialog";

/* ---------------------------------- Types --------------------------------- */

// Updated type to require an "id" field
export type DataTableProps<TData extends Record<string, unknown> & { id: string | number }> = {
  /** Your array of rows (typed with your schema, e.g. DatabaseType[]) - must include an "id" field */
  data: TData[];
  /** Optional: Provide custom column defs. If omitted, columns auto-generate from data keys. */
  columns?: ColumnDef<TData, unknown>[];
  /** Optional: Which field to text-filter against (defaults to first string-like field) */
  searchKey?: keyof TData;
  /** Optional: Enable row selection checkbox column (off by default) */
  enableRowSelection?: boolean;
  /** Optional: initial page size (default 10) */
  initialPageSize?: number;
  /** Optional: selectable page sizes */
  pageSizeOptions?: number[];
  /** Optional: extra UI elements you want to render to the right of the search box */
  toolbarSlot?: React.ReactNode;
};

/* ---------------------------- Column Auto-Build ---------------------------- */
/** Convert `snake_case` / `camelCase` keys to Nice Headers */
function prettyHeader(key: string) {
  return key
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

/** Build default columns from the first row's keys */
function buildAutoColumns<TData extends Record<string, unknown> & { id: string | number }>(
  sample: TData
): ColumnDef<TData, unknown>[] {
  return Object.keys(sample).map((key) => {
    const accessorKey = key as keyof TData as string;
    return {
      accessorKey,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
          className="px-0 gap-1"
        >
          {prettyHeader(accessorKey)}
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const v = row.getValue(accessorKey);
        return (
          <div className="truncate max-w-[28ch]">
            {v instanceof Date ? v.toLocaleString() : String(v ?? "")}
          </div>
        );
      },
    } as ColumnDef<TData, unknown>;
  });
}

/* -------------------------------- Component -------------------------------- */

export default function CustomDataTable<TData extends Record<string, unknown> & { id: string | number }>({
  data,
  columns,
  searchKey,
  enableRowSelection = false,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  toolbarSlot,
}: DataTableProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  
  const autoColumns = React.useMemo(
    () => (data?.length && !columns ? buildAutoColumns(data[0]) : []),
    [columns, data]
  );

  // If row selection is enabled, prepend the checkbox column
  const selectionColumn = React.useMemo<ColumnDef<TData, unknown> | null>(() => {
    if (!enableRowSelection) return null;
    return {
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    };
  }, [enableRowSelection]);

  const mergedColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    const base = columns ?? autoColumns;
    return selectionColumn ? [selectionColumn, ...base] : base;
  }, [columns, autoColumns, selectionColumn]);

  // Pick a sensible default search key if not provided
  const resolvedSearchKey = React.useMemo(() => {
    if (searchKey) return String(searchKey);
    if (!data?.length) return undefined;
    // choose the first primitive/string-like key
    const first = Object.keys(data[0]).find((k) => {
      const v = (data[0] as Record<string, unknown>)[k];
      return (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      );
    });
    return first;
  }, [data, searchKey]);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data: data ?? [],
    columns: mergedColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rowType = table.getRowModel().rows[0]

  const handleRowClick = React.useCallback((row: typeof rowType) => {
    const id = row.original.id;
    const newPath = `${pathname}/${id}`;
    router.push(newPath);
  }, [pathname, router]);

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  // A small helper to render numbered page links (with compactness)
  const numbered = React.useMemo(() => {
    const pages: number[] = [];
    const total = pageCount;
    const current = pageIndex + 1;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return { pages, showStartEllipsis: false, showEndEllipsis: false };
    }

    const first = 1;
    const last = total;
    const windowStart = Math.max(first + 1, current - 1);
    const windowEnd = Math.min(last - 1, current + 1);

    pages.push(first);
    for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
    if (!pages.includes(last)) pages.push(last);

    const showStartEllipsis = windowStart > first + 1;
    const showEndEllipsis = windowEnd < last - 1;
    return { pages, showStartEllipsis, showEndEllipsis };
  }, [pageCount, pageIndex]);

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {resolvedSearchKey && (
          <Input
            placeholder={`Search by ${prettyHeader(resolvedSearchKey)}`}
            value={
              (table.getColumn(resolvedSearchKey)?.getFilterValue() as string) ??
              ""
            }
            onChange={(e) =>
              table.getColumn(resolvedSearchKey)?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          {toolbarSlot}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                Columns <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllLeafColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  >
                    {prettyHeader(column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page size selector */}
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Rows / page" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="!bg-accent">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : header.column.columnDef.header
                      ? header.column.columnDef.header instanceof Function
                        ? header.column.columnDef.header(header.getContext())
                        : (header.column.columnDef.header as React.ReactNode)
                      : prettyHeader(header.column.id)}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.column.columnDef.cell
                        ? cell.column.columnDef.cell(cell.getContext() as any)
                        : String(cell.getValue() ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllLeafColumns().length} className="p-4 flex flex-col items-center gap-6">
                  <InboxIcon size={96}/>
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <p className="text-xl text-muted-foreground">There are no active databases in this project yet</p>
                    <CreateDatabaseDialog triggerText="Make a database" projectId={pathname.split('/')[2]}/>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: selection + pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} selected
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                aria-disabled={!table.getCanPreviousPage()}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {/* numbered page links */}
            {numbered.pages.map((p, idx) => {
              const current = p === pageIndex + 1;
              const prev = numbered.pages[idx - 1];
              const showEllipsisBefore = idx > 0 && p - (prev ?? 0) > 1 && idx !== 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsisBefore && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      isActive={current}
                      onClick={() => table.setPageIndex(p - 1)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                aria-disabled={!table.getCanNextPage()}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}