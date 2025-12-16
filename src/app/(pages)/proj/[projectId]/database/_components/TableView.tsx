"use client";

import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getTableData } from "@/lib/actions/database/actions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

type TableViewProps = {
  projectId: string;
};

function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return func(...args);
  }) as T;
}

const TableView = ({ projectId }: TableViewProps) => {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const schema = searchParams.get("schema") || "public";

  const pageSize = 50;
  const [startPage, setStartPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [tempPage, setTempPage] = useState("1");

  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const prevMinPageRef = useRef(1);
  const prevHeightRef = useRef(0);

  const { data, isLoading, isError, error, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage } =
    useInfiniteQuery({
      queryKey: ["tableData", projectId, schema, table, startPage],
      queryFn: ({ pageParam = startPage }) => getTableData(projectId, schema, table!, pageParam, pageSize),
      initialPageParam: startPage,
      getNextPageParam: (lastPage) => (lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined),
      getPreviousPageParam: (firstPage) => (firstPage.pagination.page > 1 ? firstPage.pagination.page - 1 : undefined),
      enabled: !!table && !!schema,
    });

  const allRows = data?.pages.flatMap((p) => p.rows) || [];
  const columns = data?.pages[0]?.columns || [];
  const minPage = data?.pages[0]?.pagination.page || 1;
  const maxPage = data?.pages[data?.pages.length - 1]?.pagination.page || 1;
  const totalPages = data?.pages[0]?.pagination.totalPages || 0;

  useEffect(() => {
    setTempPage(currentPage.toString());
  }, [currentPage]);

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

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const containerRect = scrollRef.current.getBoundingClientRect();
    const trs = scrollRef.current.querySelectorAll("tbody tr");

    let topRowIndex = -1;
    for (let i = 0; i < trs.length; i++) {
      const rowRect = trs[i].getBoundingClientRect();
      if (rowRect.bottom > containerRect.top) {
        topRowIndex = i;
        break;
      }
    }

    if (topRowIndex === -1) {
      topRowIndex = trs.length - 1;
    }

    const calculatedPage = minPage + Math.floor(topRowIndex / pageSize);
    setCurrentPage(calculatedPage);
  };

  useEffect(() => {
    const throttledHandleScroll = throttle(handleScroll, 200);

    const currentScrollRef = scrollRef.current;
    currentScrollRef?.addEventListener("scroll", throttledHandleScroll);

    return () => {
      currentScrollRef?.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [data]);

  useEffect(() => {
    if (data && scrollRef.current) {
      handleScroll();
    }
  }, [data]);

useEffect(() => {
  if (!topRef.current || !scrollRef.current) return;

  const obs = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
        fetchPreviousPage();
      }
    },
    { 
      root: scrollRef.current, 
      threshold: 0.05, // Lower threshold - triggers when 10% visible
      rootMargin: "25px" // Add margin to trigger earlier
    }
  );

  const currentTopRef = topRef.current;
  obs.observe(currentTopRef);

  return () => {
    if (currentTopRef) {
      obs.unobserve(currentTopRef);
    }
  };
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
    { 
      root: scrollRef.current, 
      threshold: 0.1, // Lower threshold
      rootMargin: "50px" // Add margin to trigger earlier
    }
  );

  const currentBottomRef = bottomRef.current;
  obs.observe(currentBottomRef);

  return () => {
    if (currentBottomRef) {
      obs.unobserve(currentBottomRef);
    }
  };
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePageChange = () => {
    let np = parseInt(tempPage);
    if (isNaN(np) || np < 1) np = 1;
    if (np > totalPages) np = totalPages;

    if (np >= minPage && np <= maxPage) {
      const rowIndex = (np - minPage) * pageSize;
      const trs = scrollRef.current?.querySelectorAll("tbody tr");
      const target = trs?.[rowIndex];
      
      if (target && scrollRef.current) {
        // Instead of scrollIntoView, calculate and set scrollTop manually
        const container = scrollRef.current;
        const containerTop = container.getBoundingClientRect().top + container.scrollTop;
        const targetTop = target.getBoundingClientRect().top + container.scrollTop;
        const scrollTo = targetTop - containerTop;
        
        container.scrollTo({
          top: scrollTo,
          behavior: "smooth"
        });
      }
      
      setCurrentPage(np);
    } else {
      setStartPage(np);
    }
  };

  if (!table) {
    return (
      <div className="fullscreen flex flex-col items-center justify-center gap-4">
        <Database className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Select a table from the sidebar to view its data</p>
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
        <p className="text-red-500">Failed to load table data: {(error as Error)?.message}</p>
      </div>
    );
  }

  if (!data || allRows.length === 0) {
    return (
      <div className="fullscreen flex flex-col items-center justify-center">
        <p className="text-muted-foreground">No data in this table</p>
      </div>
    );
  }

  // In the TableView component's return statement:
  return (
    <div className="w-full h-full flex flex-col overflow-hidden"> {/* Add overflow-hidden */}
      {/* Header */}
      <div className="flex items-center justify-between border-b p-2 flex-shrink-0">
        <div />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page</span>
          <Input
            type="number"
            className="w-20"
            value={tempPage}
            onChange={(e) => setTempPage(e.target.value)}
            onBlur={handlePageChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handlePageChange();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
          />
          <span className="text-sm text-muted-foreground">out of {totalPages}</span>
        </div>
      </div>

      {/* Table container - This is where scrolling happens */}
      <div ref={scrollRef} className="flex-1 overflow-auto min-h-0"> {/* Add min-h-0 */}
        {hasPreviousPage && (
          <div ref={topRef} className="flex items-center justify-center h-10">
            {isFetchingPreviousPage && <Skeleton className="h-4 w-32 bg-gray-700" />}
          </div>
        )}
        
        <div className="border">
          <div className="sticky top-0 bg-background z-10"> {/* Wrapper for sticky header */}
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col: any) => (
                    <TableHead key={col.column_name} className="font-semibold bg-background">
                      <div className="flex flex-col">
                        <span>{col.column_name}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {col.data_type}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          <Table>
            <TableBody>
              {allRows.map((row: any, idx: number) => (
                <TableRow key={row.$id || idx}>
                  {columns.map((col: any) => (
                    <TableCell key={col.column_name}>
                      {row[col.column_name] === null ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : typeof row[col.column_name] === "object" ? (
                        JSON.stringify(row[col.column_name])
                      ) : (
                        String(row[col.column_name])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {hasNextPage && (
          <div ref={bottomRef} className="flex items-center justify-center h-10">
            {isFetchingNextPage && <Skeleton className="h-4 w-32 bg-gray-700" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableView;