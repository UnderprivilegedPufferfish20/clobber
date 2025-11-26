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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpNarrowWide as ArrowUpNarrowWideIcon,
  ArrowDownWideNarrow as ArrowDownWideNarrowIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
} from "lucide-react";
import { DATA_TYPES } from "@/lib/types";
import { useRouter, usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SqlFilter, FilterCondition } from "@/app/(pages)/proj/[projectId]/database/[databaseId]/_components/SQLFilter";
import { isValidForType, coerceToDate } from "@/lib/utils";
import { ColumnSchema, ColumnarData } from "@/lib/types/table";
import AddToTable from "./AddToTable";

export type CustomDataTableProps = {
  /** Column definitions in the required { columnName: DATA_TYPES } shape */
  columns?: ColumnSchema | null;
  /** Column-oriented data; arrays MUST exist for each column and be equal length */
  data?: ColumnarData | null;
  /** Initial visible columns (defaults to all) */
  initialVisibleColumns?: string[];
  /** Optional custom empty state to show inside the table body when no rows */
  renderEmpty?: (info: { columns: string[] }) => React.ReactNode;
  /** Optional initial global filter string */
  initialFilter?: string;
  /** Optional initial page size */
  initialPageSize?: number;
  /** Optional initial offset (skips N rows before pagination) */
  initialOffset?: number;
  /** Date formatting for datetime cells */
  formatDate?: (d: Date) => string;
  /** ClassName passthrough */
  className?: string;
  /** Enable row click navigation */
  redirectOnClick?: boolean;
  /** Optional message for when schema or data are falsy */
  noDataMessage?: string;
  /** Optional title of the table */
  title?: string;
};

/** Validate columnar data matches schema; returns row objects if valid or throws detailed Error */
function materializeRows(schema: ColumnSchema, columnar: ColumnarData) {
  // 1) Keys must match exactly
  const schemaKeys = Object.keys(schema);
  const dataKeys = Object.keys(columnar);
  const missing = schemaKeys.filter((k) => !(k in columnar));
  const extra = dataKeys.filter((k) => !(k in schema));
  if (missing.length || extra.length) {
    const parts: string[] = [];
    if (missing.length) parts.push(`Missing data for columns: ${missing.join(", ")}`);
    if (extra.length) parts.push(`Unknown data keys present: ${extra.join(", ")}`);
    throw new Error(parts.join(" | "));
  }

  // 2) All arrays must be arrays and equal length
  const lengths = schemaKeys.map((k) => {
    const arr = (columnar as any)[k];
    if (!Array.isArray(arr)) throw new Error(`Data for column "${k}" must be an array`);
    return arr.length;
  });
  const uniqueLens = new Set(lengths);
  if (uniqueLens.size > 1) {
    throw new Error(
      `All data arrays must have the same length. Got lengths: ${schemaKeys
        .map((k, i) => `${k}=${lengths[i]}`)
        .join(", ")}`
    );
  }

  // 3) Type-check each value
  schemaKeys.forEach((k) => {
    const t = schema[k];
    const arr = (columnar as any)[k] as unknown[];
    arr.forEach((v, idx) => {
      if (!isValidForType(v, t)) {
        throw new Error(`Type mismatch at column "${k}", row ${idx}. Expected ${t}.`);
      }
    });
  });

  const rowCount = lengths[0] ?? 0;
  // 4) Turn into row objects
  const rows = Array.from({ length: rowCount }, (_, r) => {
    const obj: Record<string, unknown> = {};
    for (const k of schemaKeys) obj[k] = (columnar as any)[k][r] ?? null;
    return obj;
  });

  return rows as Array<Record<string, unknown>>;
}

// Apply SQL-like filters to rows
function applyFilters(rows: Array<Record<string, unknown>>, filters: FilterCondition[], schema: ColumnSchema): Array<Record<string, unknown>> {
  if (!filters || filters.length === 0) return rows;

  return rows.filter((row) => {
    let result = true;
    let currentLogic: "AND" | "OR" | null = null;

    for (const filter of filters) {
      const columnValue = row[filter.column];
      const columnType = schema[filter.column];

      let conditionMet = false;

      switch (filter.operator) {
        case "EQUALS":
          if (columnType === DATA_TYPES.DateTime) {
            const rowDate = coerceToDate(columnValue);
            const filterDate = coerceToDate(filter.value);
            conditionMet = rowDate?.getTime() === filterDate?.getTime();
          } else if (columnType === DATA_TYPES.BOOL) {
            conditionMet = Boolean(columnValue) === (filter.value.toLowerCase() === "true");
          } else {
            conditionMet = String(columnValue ?? "").toLowerCase() === filter.value.toLowerCase();
          }
          break;

        case "NOT_EQUALS":
          if (columnType === DATA_TYPES.DateTime) {
            const rowDate = coerceToDate(columnValue);
            const filterDate = coerceToDate(filter.value);
            conditionMet = rowDate?.getTime() !== filterDate?.getTime();
          } else if (columnType === DATA_TYPES.BOOL) {
            conditionMet = Boolean(columnValue) !== (filter.value.toLowerCase() === "true");
          } else {
            conditionMet = String(columnValue ?? "").toLowerCase() !== filter.value.toLowerCase();
          }
          break;

        case "LIKE":
          conditionMet = String(columnValue ?? "").toLowerCase().includes(filter.value.toLowerCase());
          break;

        case "NOT_LIKE":
          conditionMet = !String(columnValue ?? "").toLowerCase().includes(filter.value.toLowerCase());
          break;

        case "IN": {
          const inValues = filter.value.split(",").map((v) => v.trim().toLowerCase());
          conditionMet = inValues.includes(String(columnValue ?? "").toLowerCase());
          break;
        }

        case "NOT_IN": {
          const notInValues = filter.value.split(",").map((v) => v.trim().toLowerCase());
          conditionMet = !notInValues.includes(String(columnValue ?? "").toLowerCase());
          break;
        }

        case "GREATER_THAN":
          if (columnType === DATA_TYPES.DateTime) {
            const rowDate = coerceToDate(columnValue);
            const filterDate = coerceToDate(filter.value);
            conditionMet = !!(rowDate && filterDate && rowDate.getTime() > filterDate.getTime());
          } else {
            const numValue = Number(columnValue);
            const filterNum = Number(filter.value);
            conditionMet = !isNaN(numValue) && !isNaN(filterNum) && numValue > filterNum;
          }
          break;

        case "LESS_THAN":
          if (columnType === DATA_TYPES.DateTime) {
            const rowDate = coerceToDate(columnValue);
            const filterDate = coerceToDate(filter.value);
            conditionMet = !!(rowDate && filterDate && rowDate.getTime() < filterDate.getTime());
          } else {
            const numValue = Number(columnValue);
            const filterNum = Number(filter.value);
            conditionMet = !isNaN(numValue) && !isNaN(filterNum) && numValue < filterNum;
          }
          break;

        case "GREATER_EQUAL":
          if (columnType === DATA_TYPES.DateTime) {
            const rowDate = coerceToDate(columnValue);
            const filterDate = coerceToDate(filter.value);
            conditionMet = !!(rowDate && filterDate && rowDate.getTime() >= filterDate.getTime());
          } else {
            const numValue = Number(columnValue);
            const filterNum = Number(filter.value);
            conditionMet = !isNaN(numValue) && !isNaN(filterNum) && numValue >= filterNum;
          }
          break;

        case "LESS_EQUAL":
          if (columnType === DATA_TYPES.DateTime) {
            const rowDate = coerceToDate(columnValue);
            const filterDate = coerceToDate(filter.value);
            conditionMet = !!(rowDate && filterDate && rowDate.getTime() <= filterDate.getTime());
          } else {
            const numValue = Number(columnValue);
            const filterNum = Number(filter.value);
            conditionMet = !isNaN(numValue) && !isNaN(filterNum) && numValue <= filterNum;
          }
          break;

        case "IS_NULL":
          conditionMet = columnValue == null || columnValue === "";
          break;

        case "IS_NOT_NULL":
          conditionMet = columnValue != null && columnValue !== "";
          break;
      }

      // Apply logical operators
      if (currentLogic === null) {
        result = conditionMet;
      } else if (currentLogic === "AND") {
        result = result && conditionMet;
      } else if (currentLogic === "OR") {
        result = result || conditionMet;
      }

      currentLogic = filter.logicalOperator || "AND";
    }

    return result;
  });
}

// Render helpers per type
function CellRenderer({ value, type, formatDate }: { value: unknown; type: DATA_TYPES; formatDate?: (d: Date) => string }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  switch (type) {
    case DATA_TYPES.BOOL:
      return <Checkbox checked={Boolean(value)} disabled aria-readonly className="pointer-events-none" />;
    case DATA_TYPES.DateTime: {
      const d = coerceToDate(value);
      return <span>{d ? (formatDate ? formatDate(d) : d.toLocaleString()) : "—"}</span>;
    }
    case DATA_TYPES.EMAIL:
      return (
        <a href={`mailto:${value as string}`} className="underline underline-offset-2">
          {String(value)}
        </a>
      );
    case DATA_TYPES.URL:
      return (
        <a href={String(value)} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          {String(value)}
        </a>
      );
    case DATA_TYPES.FLOAT:
    case DATA_TYPES.INT:
      return <span className="tabular-nums text-right block">{String(value)}</span>;
    case DATA_TYPES.STRING:
    default:
      return <span>{String(value)}</span>;
  }
}

// ---------------- Component ----------------
export default function CustomDataTable({
  columns: schema,
  data: columnar,
  initialVisibleColumns,
  renderEmpty,
  initialFilter = "",
  initialPageSize = 10,
  initialOffset = 0,
  formatDate,
  className,
  redirectOnClick,
  noDataMessage = "No data. Adjust filters or add rows.",
  title,
}: CustomDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive column names safely (works even if schema is falsy)
  const allColumns = useMemo(() => (schema && typeof schema === "object" ? Object.keys(schema) : []), [schema]);

  // Build tanstack columns from schema (empty array if no schema)
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!schema) return [];
    return allColumns.map((key) => {
      const type = schema[key];
      return {
        id: key,
        accessorKey: key,
        header: key,
        size: type === DATA_TYPES.STRING ? 260 : 160,
        cell: ({ getValue }) => <CellRenderer value={getValue()} type={type} formatDate={formatDate} />,
        enableSorting: type !== DATA_TYPES.BOOL, // simple rule
        meta: { type },
      } as ColumnDef<Record<string, unknown>>;
    });
  }, [allColumns, schema, formatDate]);

  // Validate + materialize rows (defensive: tolerate falsy schema/data or validation errors)
  const baseRows = useMemo(() => {
    if (!schema || !columnar) return [] as Array<Record<string, unknown>>;
    try {
      return materializeRows(schema, columnar);
    } catch (e) {
      // In "friendly" mode, swallow validation errors and show empty state instead of crashing
      if (process.env.NODE_ENV !== "production") console.error("CustomDataTable validation error:", e);
      return [] as Array<Record<string, unknown>>;
    }
  }, [schema, columnar]);

  // SQL Filters state
  const [sqlFilters, setSqlFilters] = useState<FilterCondition[]>([]);

  // Apply SQL filters before offset and pagination
  const filteredRows = useMemo(() => {
    if (!schema) return baseRows; // nothing to filter against without schema
    return applyFilters(baseRows, sqlFilters, schema);
  }, [baseRows, sqlFilters, schema]);

  // Offset (pre-pagination)
  const [offset, setOffset] = useState<number>(Math.max(0, initialOffset));
  const offsetRows = useMemo(() => filteredRows.slice(offset), [filteredRows, offset]);

  const [pageSize, setPageSize] = useState<number>(Math.max(1, initialPageSize));

  // Visible columns state (defensive against stale/invalid input)
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    const requested = initialVisibleColumns ?? allColumns;
    return requested.filter((k) => allColumns.includes(k));
  });

  useEffect(() => {
    // Reconcile visible columns if schema changes
    setVisibleCols((prev) => prev.filter((k) => allColumns.includes(k)));
  }, [allColumns]);

  // Sorting & global text filtering
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>(initialFilter);

  const table = useReactTable({
    data: offsetRows,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility: Object.fromEntries(allColumns.map((k) => [k, visibleCols.includes(k)])),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const f = String(filterValue).toLowerCase();
      
      // Check all visible columns
      for (const col of columns) {
        const colId = col.id || (col as any).accessorKey;
        if (!colId || !visibleCols.includes(colId)) continue;
        
        const v = row.getValue(colId);
        if (v == null) continue;
        
        const colType = (col.meta as any)?.type;
        const isDate = colType === DATA_TYPES.DateTime;
        const s = isDate ? coerceToDate(v)?.toISOString() : String(v);
        if ((s ?? "").toLowerCase().includes(f)) return true;
      }
      return false;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
  });

  // keep columnVisibility in sync with visibleCols
  useEffect(() => {
    table.setColumnVisibility(Object.fromEntries(allColumns.map((k) => [k, visibleCols.includes(k)])));
  }, [visibleCols, allColumns, table]);

  // Adjust page size when controlled input changes
  useEffect(() => {
    table.setPageSize(Number(pageSize));
  }, [pageSize, table]);

  // Derived booleans
  const hasSchema = !!schema && allColumns.length > 0;
  const hasDataInput = !!columnar;
  const hasRows = table.getRowModel().rows.length > 0;

  // If either schema or data are falsy, render the friendly empty state — but keep header if schema columns exist
  const shouldShowEmpty = !hasSchema || !hasDataInput || !hasRows;

  return (
    <div className={className}>
      {hasSchema && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-4">
            {title && <h1 className="font-semibold text-xl">{title}</h1>}
            <SqlFilter columns={schema!} filters={sqlFilters} onFiltersChange={setSqlFilters} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allColumns.map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleCols.includes(key)}
                  onCheckedChange={(checked) => {
                    setVisibleCols((prev) => (checked ? [...prev, key] : prev.filter((c) => c !== key)));
                  }}
                >
                  {key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table (always render header if we have any columns) */}
      <div className="rounded-md border">
        <ShadTable>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap bg-accent">
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? "cursor-pointer select-none" : undefined}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUpNarrowWideIcon size={20} className="inline ml-2" />,
                          desc: <ArrowDownWideNarrowIcon size={20} className="inline ml-2" />,
                        }[header.column.getIsSorted() as string] ?? (
                          header.column.getCanSort() ? <ChevronsUpDownIcon size={20} className="inline ml-2" /> : null
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {shouldShowEmpty ? (
              <TableRow>
                <TableCell colSpan={Math.max(1, table.getAllLeafColumns().length)}>
                  {renderEmpty ? (
                    renderEmpty({ columns: allColumns })
                  ) : (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {!hasSchema || !hasDataInput
                        ? noDataMessage
                        : sqlFilters.length > 0 || globalFilter
                        ? "No results match your filters."
                        : "No data. Adjust filters or add rows."}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    if (!redirectOnClick) return;
                    const id = row.getValue("id");
                    if (id != null) router.push(`${pathname}/${id}`);
                  }}
                  className={redirectOnClick ? "cursor-pointer hover:bg-muted/50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadTable>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <AddToTable />
          <div className="text-sm text-muted-foreground">
            {hasSchema && sqlFilters.length > 0 ? (
              <div className="text-sm text-muted-foreground">
                Showing {filteredRows.length} of {baseRows.length} rows after filtering
              </div>
            ) : (
              <>{table.getRowCount()} Rows</>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
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
    </div>
  );
}