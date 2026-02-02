"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowLeftIcon, ArrowRightIcon, ArrowUp, ArrowUpDown, Columns3CogIcon, Database, DotIcon, XIcon } from "lucide-react";
import { act, Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from 'react-dom'
import { parseFiltersParam, stringifyFilters } from "@/lib/utils";
import { ColumnType, FilterConfig, FilterOperator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Filter from "./Filter";
import AddColumnSheet from "@/app/proj/[projectId]/database/_components/sheets/AddColumnSheet";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "./ui/separator";
import FilterComponent from "./Filter";





export default function DataViewer<T>({
  projectId,
  data,
  maxPage,
  columns,
  rowCnt,
  name,
  timeMs
}: {
  projectId: string,
  data: T[],
  maxPage: number,
  columns: ColumnType[],
  rowCnt: number,
  name?: string,
  timeMs: number
}) {
  const router = useRouter();
  const pathname = usePathname()
  const searchParams = useSearchParams();
  const table = name ? name : searchParams.get("table");

  const setSearchParam = (key: string, value: string) => {
    const ps = new URLSearchParams(searchParams)
    ps.set(key, value)
    router.push(`${pathname}?${ps}`)
  }

  const sortStr = searchParams.get("sort") || "";
  let sortColumn: string | undefined;
  let sortDir: "asc" | "desc" | undefined;
  if (sortStr) {
    const [col, dir] = sortStr.split(":");
    sortColumn = col;
    sortDir = dir as "asc" | "desc";
  }


  const [currentPage, setCurrentPage] = useState(1);

  
  const currentFilter = searchParams.get("filter") ?? "";
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>(parseFiltersParam(currentFilter));

  useEffect(() => {
    const next = activeFilters.length === 0 
      ? "" 
      : stringifyFilters(activeFilters); // Direct pass!

    if (currentFilter === next) return;

    const sp = new URLSearchParams(searchParams);
    if (!next) sp.delete("filter");
    else sp.set("filter", next);

    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }, [activeFilters, currentFilter, pathname, router, searchParams]);



  const [limit, setLimit] = useState<number>(50)
  const [offset, setOffset] = useState<number>(0)

  useEffect(() => {
    if (limit > 500) setLimit(500);

    setSearchParam("limit", String(limit));
  }, [limit])

  useEffect(() => {
    setSearchParam("offset", String(offset));
  }, [offset])
  
  

  useEffect(() => {
    const qf = parseFiltersParam(searchParams.get("filter") || "");

    setActiveFilters(qf);
  }, [searchParams]);




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

    flushSync(() => setCurrentPage(1));
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const [activeCols, setActiveCols] = useState<ColumnType[]>(columns)

return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b shrink-0 p-2">
        <div className="flex items-center gap-8">
          <h1 className="font-semibold text-2xl">{table}</h1>

          <div className="flex items-center gap-2">
            <FilterComponent 
              activeFilters={activeFilters}
              columns={columns}
              setActiveFilters={setActiveFilters}         
            />

            <ColumnToggle 
              activeCols={activeCols}
              cols={columns}
              setActiveCols={setActiveCols}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-0.5">
            <p>{rowCnt} rows</p>
            <DotIcon className="h-4 w-4"/>
            <p>{Math.round(timeMs)}ms</p>
          </div>

          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-br-none! rounded-tr-none!"
                    disabled={offset < 0}
                    variant={"outline"}
                    size={"icon"}
                    onClick={() => {
                      if (offset - limit < 0) {
                        setOffset(0);
                        return
                      }
                      setOffset(p => p - limit)
                    }}
                  >
                    <ArrowLeftIcon className="w-4 h-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Previous Page
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Input 
                    className="w-14 min-w-14 max-w-14 rounded-none! text-center"
                    placeholder="Lim"
                    value={limit}
                    onChange={(e) => {
                      const val = e.target.value

                      if (!val) setLimit(0);

                      if (Number(val)) {
                        setLimit(Number(val))
                      }
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Limit
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Input 
                    className="min-w-14 w-fit max-w-14 rounded-none! text-center"
                    value={offset}
                    placeholder="Off"
                    onChange={(e) => {
                      const val = e.target.value
                      if (!val) setOffset(0);

                      if (Number(val)) {
                        setOffset(Number(val))
                      }
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Offset
                </TooltipContent>
              </Tooltip>
            
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    className="rounded-bl-none! rounded-tl-none!"
                    disabled={offset + limit >= rowCnt}
                    variant={"outline"}
                    size={"icon"}
                    onClick={() => {
                      setOffset(p => p + limit)
                    }}
                  >
                    <ArrowRightIcon className="w-4 h-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Next Page
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Scrolling container */}
      <div
        className="flex-1 min-h-0 overflow-auto pb-20"
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shrink-0">
            <TableRow className="bg-muted/30">
              {activeCols.map((col: ColumnType) => (
                <TableHead
                  key={col.name}
                  className={[
                    "font-semibold align-bottom cursor-pointer",
                    "border-b border-border",
                    "border-r border-border last:border-r-0",
                    "px-3 py-2",
                    "bg-white/5",
                  ].join(" ")}
                  onClick={() => handleSort(col.name)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{col.name}</span>
                      {sortColumn === col.name ? (
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
                      {col.dtype}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No data in this table
                </TableCell>
              </TableRow>
            )}
            {data.map((row: any, idx: number) => {
              const rowKey = String(row.$id ?? `${currentPage}-${idx}`);
              return (
                <TableRow
                  key={rowKey}
                  className="hover:bg-muted/40"
                >
                  {activeCols.map((col: any, index: number) => {
                    const colName = col.name;
                    const raw = row[colName];
                    const isNull = raw === null;

                    return (
                      <TableCell
                        key={colName}
                        className={[
                          "px-3 py-2 align-top",
                          "border-b border-border",
                          "border-r border-border last:border-r-0",
                          "cursor-text truncate",
                        ].join(" ")}
                      >
                        {isNull ? (
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
    </div>
  );
};

function ColumnToggle({
  cols,
  activeCols,
  setActiveCols
}: {
  cols: ColumnType[]
  activeCols: ColumnType[]
  setActiveCols: Dispatch<SetStateAction<ColumnType[]>>
}) {

  const activeColsNamesSet = useMemo(() => {
    return new Set(activeCols.map(c => c.name))
  }, [activeCols])

  
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const filteredCols = useMemo(() => {
    return cols.filter(c => {
      return c.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    })
  }, [searchTerm, cols])
  
  useEffect(() => {
    setSearchTerm("")
    setSelectedIndex(-1)
  }, [open])

  useEffect(() => {
    if (filteredCols.length > 0) {
      setSelectedIndex(0)
    } else {
      setSelectedIndex(-1)
    }
  }, [filteredCols])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
    >
      <DropdownMenuTrigger asChild className="relative"> 
        <Button className="flex items-center gap-2 relative" variant="outline" >
           <Columns3CogIcon className="w-4 h-4" /> 
           Columns 
           <div className={`${activeCols.length === cols.length && "hidden"} absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-background`}> 
             {cols.length - activeCols.length} 
           </div> 
        </Button> 
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-2xs p-0!"
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-md">Visible Columns</h1>

              <Button
                variant={"outline"}
                onClick={() => {
                  if (activeCols.length === cols.length) {
                    setActiveCols([])
                  } else {
                    setActiveCols(cols)
                  }
                }}
              >
                {activeCols.length === cols.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div
              onKeyDown={e => e.stopPropagation()}
            >
              <Input 
                ref={inputRef}
                className="w-full"
                value={searchTerm}
                onChange={e => {
                  e.stopPropagation()
                  setSearchTerm(e.target.value)
                }}
                placeholder="Search Columns"
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (filteredCols.length > 0) {
                      setSelectedIndex((prev) => (prev + 1) % filteredCols.length)
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    if (filteredCols.length > 0) {
                      setSelectedIndex((prev) => (prev - 1 + filteredCols.length) % filteredCols.length)
                    }
                  } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault()
                    const c = filteredCols[selectedIndex]
                    if (activeColsNamesSet.has(c.name)) {
                      setActiveCols(p => p.filter(column => column.name !== c.name))
                    } else {
                      setActiveCols(p => [...p, c])
                    }
                  }
                }}
              />
            </div>
            <Separator />
          </DropdownMenuLabel>
          {filteredCols.length === 0 && (
            <div 
              className="flex flex-col items-center gap-2 text-center text-muted-foreground m-3"
            >
              <p>No results</p>
              <Button
                variant={"ghost"}
                className="w-fit p-1! hover:underline"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </div>
          )}
          {filteredCols.map((c, index) => {

            return (
              <DropdownMenuCheckboxItem
                key={c.name}
                onSelect={(e) => e.preventDefault()}  
                onPointerDown={(e) => e.preventDefault()}  
                onPointerMove={(e) => e.preventDefault()}
                checked={activeColsNamesSet.has(c.name)}
                onCheckedChange={checked => {
                  if (checked) {
                    setActiveCols(p => [...p, c])
                  } else {
                    setActiveCols(p => p.filter(column => column.name !== c.name))
                  }
                }}
                className={selectedIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-accent-foreground cursor-pointer'}
              >
                {c.name}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}