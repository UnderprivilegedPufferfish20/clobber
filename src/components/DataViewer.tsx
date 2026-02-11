"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowDown, ArrowLeftIcon, ArrowRightIcon, ArrowUp, ArrowUpDown, Columns3CogIcon, DotIcon, DownloadIcon, EllipsisVerticalIcon, FileJson, FileJsonIcon, FileSpreadsheetIcon, FileTextIcon, FilterIcon, Grid2x2XIcon, PlusIcon, RefreshCwIcon, SquareDashedTopSolidIcon, Trash2Icon, XIcon } from "lucide-react";
import {  Dispatch, SetStateAction, use, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from 'react-dom'
import { ALIAS_TO_ENUM, OP_TO_LABEL, OP_TO_TOKEN, parseFiltersParam, stringifyFilters } from "@/lib/utils";
import { ColumnType, DATA_EXPORT_FORMATS, FilterConfig, FilterOperator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { DTypes } from "@/lib/constants";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { deleteSelectedRows, downloadSelectedRows } from "@/lib/actions/database/tables";


export default function DataViewer<T>({
  projectId,
  data,
  columns,
  rowCnt,
  name,
  timeMs,
  schema,
  closeBtn
}: {
  projectId: string,
  data: T[],
  columns: ColumnType[],
  rowCnt: number,
  name: string,
  schema: string,
  timeMs: number,
  closeBtn: boolean
}) {

  const router = useRouter();
  const pathname = usePathname()
  const searchParams = useSearchParams();
  const pkeyCols = new Set(columns.filter(c => c.is_pkey).map(c => c.name))

  const pkeyArr = useMemo(() => [...pkeyCols].sort(), [pkeyCols]); // Sort for consistent order

  const computeRowId = (row: any) => JSON.stringify(pkeyArr.map(col => row[col]));

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

    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const [activeCols, setActiveCols] = useState<ColumnType[]>(columns)

  const [selectedRows, setSelectedRows] = useState<Map<string, any>>(new Map())

  const {mutate: downloadSelected, isPending: isDownloadPending} = useMutation({
    mutationFn: async (type: DATA_EXPORT_FORMATS) => {
      const rowsArray = Array.from(selectedRows.values());
      const exportData = await downloadSelectedRows(
        rowsArray,
        type,
        name,
        schema, // Or dynamic schema
        columns,
      );
      if (!exportData) throw new Error("Failed to export");

      const blob = new Blob([exportData.data], { type: exportData.contentType });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = exportData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href)
    },
    onMutate: () => toast.loading("Downloading...", { id: "download-sel" }),
    onSuccess: () => {
      toast.success(`${selectedRows.keys()} rows downloaded`, {id: "download-sel"})
      setSelectedRows(new Map())
    },
    onError: (e) => toast.error(`Failed to download: ${e}`, { id: "download-sel"})
  })


  const {mutate: deleteSelected, isPending: isDeletePending} = useMutation({
    mutationFn: async () => {
      
      const rowsArray = Array.from(selectedRows.values());
      await deleteSelectedRows(
        rowsArray,
        "auth", // Or dynamic
        "users", // Or dynamic
        projectId,
        "auth-users",
        pkeyCols
      );

      setSelectedRows(new Map())
    },
    onMutate: () => toast.loading("Deleting...", { id: "delete-sel" }),
    onSuccess: () => {
      toast.success(`${selectedRows.size} rows deleted`, {id: "delete-sel"})
      setSelectedRows(new Map())
    },
    onError: (e) => toast.error(`Failed to delete: ${e}`, { id: "delete-sel"})
  })

  const totalPages = limit > 0 ? Math.ceil(rowCnt / limit) : 1;

  useEffect(() => {
    if (selectedRows.size === 0) {
      toast.dismiss("selected-rows");
      return
    }

    toast(() => (
      <div className="flex flex-1 items-center justify-between gap-2 rounded-md text-muted-foreground w-lg min-w-lg max-w-lg">
        <div className="flex items-center gap-2">
          <div className="text-white bg-indigo-500 rounded-sm w-6 h-6 flex items-center justify-center">
            <p>{selectedRows.size}</p>
          </div>
          <p className="text-lg">rows selected</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={"outline"}
                onClick={() => {}}
              >
                <DownloadIcon className="w-4 h-4"/>
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-800">
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => downloadSelected(DATA_EXPORT_FORMATS.JSON)}

              >
                <FileJson className="w-6 h-6" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => downloadSelected(DATA_EXPORT_FORMATS.CSV)}
              >
                <FileSpreadsheetIcon className="w-6 h-6" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => downloadSelected(DATA_EXPORT_FORMATS.SQL)}
              >
                <FileTextIcon className="w-6 h-6" />
                SQL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => deleteSelected()}
            variant={"outline"}
            className="flex items-center gap-2"
          > 
            <Trash2Icon className="w-4 h-4"/>
            Delete
          </Button>

          <Button
            variant={"ghost"}
            size={"icon-sm"}
            onClick={() => setSelectedRows(new Map())}
          >
            <XIcon className="w-4 h-4"/>
          </Button>
        </div>
      </div>
    ), { 
      position: "bottom-center", 
      id: "selected-rows",
      duration: Infinity,
      className: "w-[542px] min-w-[542px] max-w-[542px]" 
    })
  }, [selectedRows])

  
  const [selectedPage, setSelectedPage] = useState<number>(1)

  useEffect(() => {
    setOffset((selectedPage - 1) * limit)
  }, [selectedPage]);
  

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b shrink-0 p-2">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <FilterComponent
              activeFilters={activeFilters}
              columns={columns}
              setActiveFilters={setActiveFilters}
            />
            <ColumnToggle activeCols={activeCols} cols={columns} setActiveCols={setActiveCols} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-0.5">
            <p>{rowCnt} rows</p>
            <DotIcon className="h-4 w-4" />
            <p>{Math.round(timeMs)}ms</p>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-br-none! rounded-tr-none!"
                    disabled={offset <= 0}
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
                <TooltipTrigger asChild>
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
                <TooltipTrigger asChild>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild className="ml-3">
                <Button
                  variant={"outline"}
                  size={"icon"}
                >
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-150" align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <DownloadIcon className="w-4 h-4" />
                    Download Page
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent alignOffset={0}>
                    <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={() => {}}
                    >
                      <FileJson className="w-6 h-6" />
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={() => {}}
                    >
                      <FileSpreadsheetIcon className="w-6 h-6" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={() => {}}
                    >
                      <FileTextIcon className="w-6 h-6" />
                      SQL
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem className="flex items-center gap-2">
                  <RefreshCwIcon className="w-4 h-4"/>
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {closeBtn && (
            <Button
              variant={"ghost"}
              size={"icon-lg"}
              onClick={() => {
                const sp = new URLSearchParams(searchParams)
                sp.delete("table")
                sp.delete("offset")
                sp.delete("limit")
                sp.delete("filter")
                sp.delete("sort")

                router.replace(`${pathname}?${sp}`)
              }}
            >
              <XIcon className="w-6 h-6"/>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto hide-scrollbar text-sm relative">
        {activeCols.length > 0 ? (
          data.length === 0 ? (
            <div className="fullscreen flex flex-1 items-center justify-center text-muted-foreground text-2xl">
              <div className="flex flex-col justify-center items-center gap-4">
                <SquareDashedTopSolidIcon size={148}/>

                <h1>
                  No data in this table
                </h1>
                
              </div>
            </div>
          ) : (
            <div
              className="min-w-max pb-20"
              style={{
                display: "grid",
                gridTemplateColumns: `36px repeat(${activeCols.length}, minmax(180px, 1fr))`,
                gridAutoRows: "min-content",
                alignContent: "start",
              }}
            >
              {/* Sticky header row */}
              <div className="contents">
                <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                  <div className="h-9 w-9 flex items-center justify-center border-r bg-neutral-900">
                    <Checkbox
                      className="w-4 h-4"
                      onCheckedChange={(checked) => {
                        if (pkeyCols.size === 0) return;
                        setSelectedRows((prev) => {
                          const next = new Map(prev);
                          data.forEach((row) => {
                            const id = computeRowId(row);
                            if (checked) next.set(id, row);
                            else next.delete(id);
                          });
                          return next;
                        });
                      }}
                      checked={data.length > 0 && selectedRows.size > 0}
                    />
                  </div>
                </div>

                {activeCols.map((col: ColumnType, i: number) => {
                  const Icon = DTypes.find((d) => d.dtype === ALIAS_TO_ENUM[col.dtype])!.icon;

                  return (
                    <div
                      key={col.name}
                      className={[
                        "sticky top-0 z-10",
                        "border-b",
                        "dark:bg-neutral-900",
                        i === 0 ? "border-l-0" : "border-l",
                        "p-2 h-9",
                        "cursor-pointer hover:bg-muted/40",
                        "flex items-center justify-between gap-2",
                      ].join(" ")}
                      onClick={() => handleSort(col.name)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
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
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                  );
                })}
              </div>

              {/* Body rows */}
              {data.map((row: any, idx: number) => {
                const id = computeRowId(row);
                const isSelected = selectedRows.has(id);

                return (
                  <div key={row.ctid} className="contents">
                    {/* left "row number / checkbox" cell */}
                    <div className="border-b border-r h-9 w-9 flex items-center justify-center group hover:bg-muted/40">
                      {isSelected ? (
                        <Checkbox
                          key={row.ctid}
                          className="w-4 h-4"
                          checked
                          onCheckedChange={(checked) => {
                            if (pkeyCols.size === 0) return;
                            setSelectedRows((prev) => {
                              const next = new Map(prev);
                              if (checked) next.set(id, row);
                              else next.delete(id);
                              return next;
                            });
                          }}
                        />
                      ) : (
                        <>
                          <Checkbox
                            key={row.ctid}
                            className="hidden group-hover:block w-4 h-4"
                            checked={false}
                            onCheckedChange={(checked) => {
                              if (pkeyCols.size === 0) return;
                              setSelectedRows((prev) => {
                                const next = new Map(prev);
                                if (checked) next.set(id, row);
                                return next;
                              });
                            }}
                          />
                          <p key={row.ctid} className="group-hover:hidden text-muted-foreground">{sortStr ? row.row_index : offset + idx + 1}</p>
                        </>
                      )}
                    </div>

                    {/* data cells */}
                    {activeCols.map((col: any, i: number) => {
                      const colName = col.name;
                      const raw = row[colName];
                      const isNull = raw === null;

                      const value = isNull ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : raw instanceof Date ? (
                        <span>{raw.toLocaleDateString()}</span>
                      ) : (
                        <span>{String(raw)}</span>
                      );

                      return (
                        <TooltipProvider key={colName} delayDuration={5000}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={[
                                  "border-b",
                                  i === 0 ? "border-l-0" : "border-l",
                                  "p-2 h-9",
                                  "truncate",
                                  "hover:bg-muted/40",
                                  "cursor-pointer",
                                ].join(" ")}
                              >
                                {value}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent align="start" carat={false}>
                              {value}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="fullscreen flex flex-1 items-center justify-center text-muted-foreground text-2xl">
            <div className="flex flex-col justify-center items-center gap-4">
              <Grid2x2XIcon size={148}/>

              <div className="flex flex-col justify-center items-center gap-2">
                <h1>
                  No selected columns
                </h1>
                <Button
                  variant={"default"}
                  size={"lg"}
                  onClick={() => {
                    setActiveCols(columns)
                  }}
                >
                  Select All
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="px-2 sticky bottom-20 left-0 right-0 h-12 min-h-12 max-h-12 fullwidth flex flex-1 items-center justify-between gap-2 dark:bg-neutral-900 opacity-100">
          <div className="text-white text-2xl font-semibold flex items-baseline">
            <span className="text-muted-foreground text-lg">{schema}.</span>
            <h3>{name}</h3>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center text-lg gap-2">
              <p>page</p>
              <Select value={String(selectedPage)} onValueChange={v => setSelectedPage(Number(v))}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPages }, (_, i) => String(i + 1))
                    .reverse()
                    .map(i => (
                      <SelectItem value={i} key={i}>
                        {i}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p>of {Math.ceil(rowCnt / limit) === Infinity ? rowCnt : Math.ceil(rowCnt / limit)}</p>
            </div>

            

            

          </div>

          

          
        </div>
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


const FilterComponent = ({
  activeFilters,
  setActiveFilters,
  columns,
}: {
  activeFilters: FilterConfig[];
  setActiveFilters: Dispatch<SetStateAction<FilterConfig[]>>;
  columns: ColumnType[];
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig[]>(activeFilters);

  // Clean functional updates - use index correctly
  const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { 
      column: columns[0]?.name || '', 
      operator: FilterOperator.EQUALS, 
      value: "" 
    }]);
  };

  const applyFilters = () => {
    setActiveFilters(filters);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className="relative">
        <Button className="relative flex items-center gap-2" variant="outline">
          <FilterIcon className="w-4 h-4"/>
          <h1>Filters</h1>
          <div className={`${
            activeFilters.length === 0 && "hidden"
          } absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-background`}> 
            {activeFilters.length} 
          </div> 
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-md p-0 max-h-96 overflow-y-auto">
        <DropdownMenuGroup>
          {filters.length === 0 && (
            <div className="flex flex-col p-4">
              <h1 className="text-sm">No Filters</h1>
            </div>
          )}
          {filters.map((f, index) => (
            <div key={index} className="flex items-center gap-1 p-2 border-b last:border-b-0">
              <Select
                value={f.column}
                onValueChange={(v) => updateFilter(index, { column: v })}
              >
                <SelectTrigger className="w-39! min-w-39! max-w-39! truncate!">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-150">
                  <SelectGroup>
                    <SelectLabel>Columns</SelectLabel>
                    {columns.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={f.operator}
                onValueChange={(v) => updateFilter(index, { operator: v as FilterOperator })}
              >
                <SelectTrigger className="w-19! min-w-19! max-w-19! truncate!">
                  <SelectValue>
                    {filters[index]?.operator && OP_TO_TOKEN[filters[index].operator]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-150" align="start">
                  <SelectGroup>
                    <SelectLabel>Operators</SelectLabel>
                    {Object.values(FilterOperator).map((op) => (
                      <SelectItem key={OP_TO_TOKEN[op]} value={OP_TO_TOKEN[op]} className="flex items-center gap-2">
                        <p>{OP_TO_TOKEN[op]}</p>
                        <p>{OP_TO_LABEL[op]}</p>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Input
                className="w-39! min-w-39! max-w-39!"
                value={f.value}
                onChange={(e) => updateFilter(index, { value: e.target.value })}
              />

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFilter(index)}
              >
                <XIcon className="w-4 h-4"/>
              </Button>
            </div>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup className="flex items-center justify-between p-3">
          <Button
            size="sm"
            variant="outline"
            onClick={addFilter}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4"/>
            Add Clause
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={applyFilters}
            
            disabled={JSON.stringify(filters) === JSON.stringify(activeFilters)}
          >
            Apply Filters
          </Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};