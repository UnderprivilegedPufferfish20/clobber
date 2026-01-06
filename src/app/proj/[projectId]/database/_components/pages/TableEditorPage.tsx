"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown, Database, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from 'react-dom'
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { throttle } from "@/lib/utils";
import { EditingCell, FilterConfig, QueryFilters, TableViewProps } from "@/lib/types";
import Filter, { parseFiltersParam, stringifyFilters } from "../Filter";
import AddRowSheet from "../sheets/AddRowSheet";
import AddColumnSheet from "../sheets/AddColumnSheet";
import { Button } from "@/components/ui/button";
import { useSavePreselection } from "@/hooks/useSavePreselection";
import { getTableData } from "@/lib/actions/database/tables/cache-actions";



function toCellString(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const TableView = ({ projectId }: TableViewProps) => {
  useSavePreselection(projectId)
  const router = useRouter();
  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const schema = searchParams.get("schema") || "public";

  const sortStr = searchParams.get("sort") || "";
  let sortColumn: string | undefined;
  let sortDir: "asc" | "desc" | undefined;
  if (sortStr) {
    const [col, dir] = sortStr.split(":");
    sortColumn = col;
    sortDir = dir as "asc" | "desc";
  }

  const filterParam = searchParams.get("filter");
  const filters: QueryFilters = parseFiltersParam(filterParam);

  const filtersStr = stringifyFilters(filters);

  const pageSize = 50;
  const [startPage, setStartPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);

  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  

  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerRefs = useRef<HTMLTableCellElement[]>([]);
  const [widths, setWidths] = useState<number[]>([]);
  const [isMeasured, setIsMeasured] = useState(false);

  const prevMinPageRef = useRef(1);
  const prevHeightRef = useRef(0);

  // inline edit state
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useInfiniteQuery({
    queryKey: ["tableData", projectId, schema, table, filtersStr, sortStr, startPage],
    queryFn: ({ pageParam = startPage }) =>
      getTableData(
        projectId,
        schema,
        table!,
        pageParam,
        pageSize,
        filters,
        sortStr ? { column: sortColumn!, direction: sortDir!.toUpperCase() as "ASC" | "DESC" } : undefined
      ),
    initialPageParam: startPage,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.page > 1 ? firstPage.pagination.page - 1 : undefined,
    enabled: !!table && !!schema,
  });

  const allRows = useMemo(() => data?.pages.flatMap((p) => p.rows) || [], [data]);
  const columns = data?.pages[0]?.columns || [];
  const minPage = data?.pages[0]?.pagination.page || 1;
  const maxPage = data?.pages[data?.pages.length - 1]?.pagination.page || 1;
  const totalPages = data?.pages[0]?.pagination.totalPages || 0;

  // Sync active filters with URL params
  useEffect(() => {
    const qf = parseFiltersParam(searchParams.get("filter"));

    const urlFilters: FilterConfig[] = Object.entries(qf).map(([column, [op, value]]) => ({
      column,
      operator: op, // make FilterConfig.operator = FilterOperator (recommended)
      value,
    }));

    setActiveFilters(urlFilters);
  }, [searchParams]);

  // preserve scroll position when prepending pages
  useEffect(() => {
    if (!data || !scrollRef.current) return;

    const currentMin = data.pages[0].pagination.page;
    const isPrepend = currentMin < prevMinPageRef.current;

    if (isPrepend) {
      const heightDiff = scrollRef.current.scrollHeight - prevHeightRef.current;
      scrollRef.current.scrollTop += heightDiff;
    }

    prevMinPageRef.current = currentMin;
    prevHeightRef.current = scrollRef.current.scrollHeight;
  }, [data]);

  // Measure header widths after columns are available
  useEffect(() => {
    if (columns.length > 0 && headerRefs.current.length === columns.length) {
      const measuredWidths = headerRefs.current.map(
        (el) => (el ? el.getBoundingClientRect().width : 0)
      );
      setWidths(measuredWidths);
      setIsMeasured(true);
    }
  }, [columns]);

  const handleScroll = () => {
    if (isProgrammaticScroll) return;
    if (!scrollRef.current) return;

    const containerRect = scrollRef.current.getBoundingClientRect();
    const headerHeight = headerRef.current?.getBoundingClientRect().height || 0;
    const effectiveTop = containerRect.top + headerHeight;
    const trs = scrollRef.current.querySelectorAll("tbody tr");

    let topRowIndex = -1;
    for (let i = 0; i < trs.length; i++) {
      const rowRect = trs[i].getBoundingClientRect();
      if (rowRect.bottom > effectiveTop) {
        topRowIndex = i;
        break;
      }
    }
    if (topRowIndex === -1) topRowIndex = trs.length - 1;

    const calculatedPage = minPage + Math.floor(topRowIndex / pageSize);
    setCurrentPage(calculatedPage);
  };

  useEffect(() => {
    const throttled = throttle(handleScroll, 200);
    const el = scrollRef.current;
    el?.addEventListener("scroll", throttled);
    return () => el?.removeEventListener("scroll", throttled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isProgrammaticScroll]);

  useEffect(() => {
    if (data && scrollRef.current) handleScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // intersection observers
  useEffect(() => {
    if (!topRef.current || !scrollRef.current) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
          fetchPreviousPage();
        }
      },
      { root: scrollRef.current, threshold: 0.05, rootMargin: "25px" }
    );

    const el = topRef.current;
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  useEffect(() => {
    if (!bottomRef.current || !scrollRef.current) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, threshold: 0.1, rootMargin: "50px" }
    );

    const el = bottomRef.current;
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePageJump = (np: number) => {
    if (isNaN(np) || np < 1) np = 1;
    if (np > totalPages) np = totalPages;

    if (np >= minPage && np <= maxPage) {
      // Page is already loaded, scroll to it
      const rowIndex = (np - minPage) * pageSize;
      const trs = scrollRef.current?.querySelectorAll("tbody tr");
      const target = trs?.[rowIndex];

      if (target && scrollRef.current) {
        setIsProgrammaticScroll(true);
        const container = scrollRef.current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const headerHeight = headerRef.current?.getBoundingClientRect().height || 0;
        const delta = targetRect.top - containerRect.top - headerHeight;

        container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });

        setTimeout(() => setIsProgrammaticScroll(false), 500);
      }
    } else {
      // Page not loaded, fetch it and scroll to top
      flushSync(() => {
        setStartPage(np);
        setCurrentPage(np);
      });
      
      // Scroll to top after data loads
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleSort = (col: string) => {
    let newSort: string | null = null;
    if (sortColumn === col) {
      if (sortDir === "asc") {
        newSort = `${col}:desc`;
      } else {
        newSort = null;
      }
    } else {
      newSort = `${col}:asc`;
    }

    const newParams = new URLSearchParams(searchParams.toString());
    if (newSort) {
      newParams.set("sort", newSort);
    } else {
      newParams.delete("sort");
    }

    flushSync(() => setStartPage(1));
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };





  // focus input when entering edit mode
  useEffect(() => {
    if (!editing) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [editing]);

  const startEdit = (rowKey: string, col: string, raw: any) => {
    const initial = toCellString(raw);
    setEditing({ rowKey, col, initial });
    setEditValue(initial);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const commitEdit = () => {
    // NOTE: this only updates UI locally; wire this to your update mutation later.
    setEditing(null);
    setEditValue("");
  };

  if (!table) {
    return (
      <div className="fullscreen flex flex-col items-center justify-center gap-4">
        <Database className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">
          Select a table from the sidebar to view its data
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fullscreen flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-64 bg-gray-700" />
          <Skeleton className="h-8 w-32 bg-gray-700" />
        </div>
        <div className="border rounded-lg">
          <Skeleton className="h-12 w-full bg-gray-700 mb-2" />
          <Skeleton className="h-10 w-full bg-gray-700 mb-2" />
          <Skeleton className="h-10 w-full bg-gray-700 mb-2" />
          <Skeleton className="h-10 w-full bg-gray-700" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fullscreen flex flex-col items-center justify-center">
        <p className="text-red-500">
          Failed to load table data: {(error as Error)?.message}
        </p>
      </div>
    );
  }

  // if (!data || allRows.length === 0) {
  //   return (
  //     <div className="fullscreen flex flex-col items-center justify-center">
  //       <p className="text-muted-foreground">No data in this table</p>
  //     </div>
  //   );
  // }

return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-2 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <Filter 
            activeFilters={activeFilters}
            columns={columns}
            setActiveFilters={setActiveFilters}
            setStartPage={setStartPage}            
          />
          <InsertButton
            projectId={projectId}
            tableId={table}
            schema={schema}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page</span>
          <Select
            value={currentPage.toString()}
            onValueChange={(value) => {
              const np = parseInt(value);
              setCurrentPage(np);
              handlePageJump(np);
            }}
          >
            <SelectTrigger className="w-17">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <SelectItem key={page} value={page.toString()}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">out of {totalPages}</span>
        </div>
      </div>

      {/* Scrolling container */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto border rounded-md"
      >
        {hasPreviousPage && (
          <div ref={topRef} className="flex items-center justify-center h-10">
            {isFetchingPreviousPage && <Skeleton className="h-4 w-32 bg-gray-700" />}
          </div>
        )}

        {/* grid wrapper */}
  
          {/* sticky header */}
          <div ref={headerRef} className="sticky top-0 z-10 bg-background">
            <Table className={isMeasured ? "table-fixed" : "table-auto"}>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {columns.map((col: any, index: number) => (
                    <TableHead
                      ref={(el) => { headerRefs.current[index] = el!; }}
                      key={col.column_name}
                      style={isMeasured ? { width: `${widths[index]}px` } : undefined}
                      className={[
                        "font-semibold align-bottom cursor-pointer",
                        "border-b border-border",
                        "border-r border-border last:border-r-0",
                        "px-3 py-2",
                        "bg-white/5",
                      ].join(" ")}
                      onClick={() => handleSort(col.column_name)}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{col.column_name}</span>
                          {sortColumn === col.column_name ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ArrowUpDown size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-normal truncate">
                          {col.data_type}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* body */}
          <Table className={isMeasured ? "table-fixed" : ""}>
            <TableBody>
              {allRows.length === 0 && (
                <div className="fullscreen flex items-center justify-center">
                  No data in this table
                </div>
              )}
              {allRows.map((row: any, idx: number) => {
                const rowKey = String(row.$id ?? `${minPage}-${idx}`);
                return (
                  <TableRow
                    key={rowKey}
                    className="hover:bg-muted/40"
                  >
                    {columns.map((col: any, index: number) => {
                      const colName = col.column_name;
                      const raw = row[colName];
                      const isNull = raw === null;

                      const isEditing =
                        editing?.rowKey === rowKey && editing?.col === colName;

                      return (
                        <TableCell
                          key={colName}
                          style={isMeasured ? { width: `${widths[index]}px` } : undefined}
                          className={[
                            "px-3 py-2 align-top",
                            "border-b border-border",
                            "border-r border-border last:border-r-0",
                            "cursor-text truncate",
                          ].join(" ")}
                          onClick={() => {
                            if (!isEditing) startEdit(rowKey, colName, raw);
                          }}
                        >
                          {isEditing ? (
                            <Input
                              ref={inputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              onBlur={() => commitEdit()}
                              className="h-8"
                            />
                          ) : isNull ? (
                            <span className="text-muted-foreground italic">NULL</span>
                          ) : raw instanceof Date ? (
                            <span>{raw.toLocaleDateString()}</span>
                          ) : (
                            <span>{String(raw)}</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {hasNextPage && (
          <div ref={bottomRef} className="flex items-center justify-center h-10">
            {isFetchingNextPage && <Skeleton className="h-4 w-32 bg-gray-700" />}
          </div>
        )}
      </div>
  );
};

export default TableView;

function InsertButton({
  projectId,
  tableId,
  schema
}: {
  projectId: string,
  tableId: string,
  schema: string
}) {
  const [openRow, setOpenRow] = useState(false);
  const [openCol, setOpenCol] = useState(false);

  return (
    <>
      <AddRowSheet 
        onOpenChange={setOpenRow}
        open={openRow}
        projectId={projectId}
        hideTrigger 
        schema={schema}
        table={tableId}
      />
      <AddColumnSheet  
        schema={schema}
        onOpenChange={setOpenCol}
        open={openCol}
        projectId={projectId}
        hideTrigger 
        tableId={tableId}
      />



      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className='bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 flex items-center justify-center border-2'
            variant={'outline'}
          >
            Insert
          </Button> 
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setOpenRow(true)}>
            Add Row
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenCol(true)}>
            Add Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  )
}