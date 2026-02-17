"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowDown, ArrowLeftIcon, ArrowRightIcon, ArrowUp, ArrowUpDown, Columns3CogIcon, CopyIcon, CurlyBracesIcon, DotIcon, DownloadIcon, EditIcon, EllipsisIcon, EllipsisVerticalIcon, ExpandIcon, FileJson, FileJsonIcon, FileSpreadsheetIcon, FileTextIcon, FilterIcon, Grid2x2XIcon, ListOrderedIcon, Maximize2Icon, PlusIcon, RefreshCwIcon, SquareDashedTopSolidIcon, TextIcon, Trash2Icon, XIcon } from "lucide-react";
import {  ChangeEvent, Dispatch, SetStateAction, use, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from 'react-dom'
import { ALIAS_TO_ENUM, OP_TO_LABEL, OP_TO_TOKEN, parseFiltersParam, stringifyFilters } from "@/lib/utils";
import { ColumnSortType, ColumnType, DATA_EXPORT_FORMATS, FilterConfig, FilterOperator } from "@/lib/types";
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
import { addRow, deleteRow, deleteSelectedRows, downloadSelectedRows, editRow } from "@/lib/actions/database/tables";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import SheetWrapper from "./SheetWrapper";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";


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

  
  const currentFilter = searchParams.get("filter") ?? "";
  const currentSort = searchParams.get("sort") ?? ""

  
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>(parseFiltersParam(currentFilter));
  const [activeSort, setActiveSort] = useState<{column: string, dir: "ASC" | "DESC"}[]>([])
  


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

  const [addSheetOpen, setAddSheetOpen] = useState(false)

  useEffect(() => {
    const newStr: string[] = []
    const newParams = new URLSearchParams(searchParams.toString())
    if (activeSort.length === 0) {
      newParams.delete("sort")
    } else {

      for (let as of activeSort) {
        newStr.push(`${as.column}:${as.dir}`)
      }
      newParams.set("sort", newStr.join(";"))
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);
  }, [activeSort, currentSort])

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
        activeCols,
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

  const [editRowId, setEditRowId] = useState<number | null>(null)
  const [duplicateRowId, setDeplicateRowId] = useState<number | null>(null)
  const [deleteRowId, setDeleteRowId] = useState<number | null>(null)

  
  type DuplicateRowVals = {
    [K in (typeof columns)[number]["name"]]: string;
  };
  
  const initialDup = Object.fromEntries(
    columns.map(c => [c.name, ""])
  ) as DuplicateRowVals;
  
  const [editRowVals, setEditRowVals] = useState<DuplicateRowVals>(initialDup)
  const [duplicateRowVals, setDuplicateRowVals] = useState<DuplicateRowVals>(initialDup)
  const [addRowVals, setAddRowVals] = useState<DuplicateRowVals>(initialDup)

  const pkeyColsNames = columns.filter(c => c.is_pkey)

  const { mutate: delR } = useMutation({
    mutationFn: (idx: number) => 
      deleteRow(
        projectId,
        schema,
        "auth-users",
        "users",
        pkeyColsNames,
        //@ts-ignore
        pkeyColsNames.map(n => data[idx][n.name])
      ),
    onMutate: () => {
      toast.loading(`Deleting row...`, { id: "del-row" })
      setDeleteRowId(null)
    },
    onSuccess: () => toast.success(`Row deleted`, { id: "del-row" }),
    onError: (e) => toast.error(`Failed to delete row: ${e}`, { id: "del-row" })
  })

  const { mutate: updateR } = useMutation({
    mutationFn: (idx: number) => 
      editRow(
        projectId,
        schema,
        "auth-users",
        "users",
        pkeyColsNames,
        //@ts-ignore
        pkeyColsNames.map(n => data[idx][n.name]),
        editRowVals
      ),
    onMutate: () => {
      toast.loading(`Updating row...`, { id: "up-row" })
      setEditRowId(null)
    },
    onSuccess: () => toast.success(`Row updated`, { id: "up-row" }),
    onError: (e) => toast.error(`Failed to update row: ${e}`, { id: "up-row" })
  })

  const { mutate: dupR } = useMutation({
    mutationFn: async () => {

      delete duplicateRowVals.row_index;

      await addRow(
        projectId,
        schema,
        "users",
        "auth-users",
        duplicateRowVals
      )
    },
    onMutate: () => {
      toast.loading(`Duplicating row...`, { id: "dup-row" })
      setDeplicateRowId(null)
    },
    onSuccess: () => toast.success(`Row duplicated`, { id: "dup-row" }),
    onError: (e) => toast.error(`Failed to duplicate row: ${e}`, { id: "dup-row" })
  })

  useEffect(() => {
    if (duplicateRowId !== null) {
      const v = data[duplicateRowId!]
      console.log("@ROW_VALS: ", v)
      setDuplicateRowVals(v as DuplicateRowVals)
    }
  }, [duplicateRowId])

    useEffect(() => {
    if (editRowId !== null) {
      const v = data[editRowId!]
      console.log("@ROW_VALS: ", v)
      setEditRowVals(v as DuplicateRowVals)
    }
  }, [editRowId])

  
  const updateSort = (index: number, updates: Partial<ColumnSortType>) => {
    setActiveSort(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const deleteSort = (i: number) => {
    setActiveSort(p => p.filter((_, idx) => i !== idx))
  }

  const { mutate: addR } = useMutation({
    mutationFn: async () => {

      delete duplicateRowVals.row_index;

      await addRow(
        projectId,
        schema,
        "users",
        "auth-users",
        addRowVals
      )
    },
    onMutate: () => {
      toast.loading(`Adding row...`, { id: "ad-row" })
    },
    onSuccess: () => toast.success(`Row added`, { id: "ad-row" }),
    onError: (e) => toast.error(`Failed to add row: ${e}`, { id: "ad-row" })
  })

  return (
    <>
    
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between border-b shrink-0 p-2">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <FilterComponent
                activeFilters={activeFilters}
                columns={columns}
                setActiveFilters={setActiveFilters}
              />
              <SortComponent 
                activeSorts={activeSort}
                columns={columns}
                setActiveSorts={setActiveSort}
              />
              <ColumnToggle 
                activeCols={activeCols} 
                cols={columns} 
                setActiveCols={setActiveCols} 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
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
                className="min-w-full min-h-full pb-20 overflow-x-auto"
                style={{
                  display: "grid",
                  /* 1. Use 1fr to divide remaining space evenly after the 36px offsets */
                  gridTemplateColumns: `56px repeat(${activeCols.length}, 1fr) 40px`,
                  /* 2. Forces rows to the top; the 'empty' space will sit below them */
                  alignContent: "start",
                }}
              >
                {/* Sticky header row */}
                <div className="contents">
                  <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                    <div className="h-9 w-14 flex items-center border-r bg-neutral-900 pl-2">
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
                    const Icon = DTypes.find((d) => d.dtype === ALIAS_TO_ENUM[col.dtype]) ? DTypes.find((d) => d.dtype === ALIAS_TO_ENUM[col.dtype])!.icon : TextIcon;

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
                        onClick={() => {
                          if (activeSort.map(c => c.column).includes(col.name)) {
                            const sortedColumn = activeSort.find(c => c.column === col.name)!

                            const sortedColumnIndex = activeSort.indexOf(sortedColumn)!

                            if (sortedColumn.dir === "ASC") {
                              updateSort(sortedColumnIndex, { dir: "DESC" })
                            } else {
                              deleteSort(sortedColumnIndex)
                            }
                            
                          } else {
                            setActiveSort(p => [...p, { column: col.name, dir: "ASC" }])
                          }

                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{col.name}</span>
                          {activeSort.map(s => s.column).includes(col.name) ? (
                            activeSort.find(s => s.column === col.name)!.dir === "ASC" ? (
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

                  <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                    <div className="h-9 w-10 flex items-center justify-center border-l bg-neutral-900 hover:bg-neutral-800 cursor-pointer">
                      <PlusIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Body rows */}
                {data.map((row: any, idx: number) => {
                  const id = computeRowId(row);
                  const isSelected = selectedRows.has(id);

                  return (
                    <TooltipProvider key={row.ctid} delayDuration={5000}>
                      <div key={row.ctid} className="contents group">
                        {/* left "row number / checkbox" cell */}
                        <div className="pl-2 border-b border-r h-10 w-14 flex items-center gap-2 group group-hover:bg-neutral-800">
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
                              <p key={row.ctid} className="pl-1 group-hover:hidden text-muted-foreground">{offset + idx + 1}</p>
                            </>
                          )}
                          <Maximize2Icon 
                            onClick={() => setEditRowId(idx)}
                            className="stroke-muted-foreground hover:stroke-white cursor-pointer w-3 h-3 hidden group-hover:block"
                          />
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
                            <div
                              className={[
                                "border-b",
                                i === 0 ? "border-l-0" : "border-l",
                                "p-2 h-10",
                                "group-hover:bg-neutral-800",
                                "truncate",
                                "cursor-pointer",
                              ].join(" ")}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {value}
                                </TooltipTrigger>
                                <TooltipContent align="start" carat={false}>
                                  {value}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })}

                        {/* right ellipses cell */}
                        <div className="group-hover:bg-neutral-800 border-b border-l h-10 w-10 flex items-center justify-center cursor-pointer">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <EllipsisIcon className="w-6 h-6 text-muted-foreground font-bold cursor-pointer"  />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => setEditRowId(idx)}
                              >
                                <EditIcon className="w-4 h-4"/>
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => setDeplicateRowId(idx)}
                              >
                                <CopyIcon className="w-4 h-4"/>
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={async () => {
                                  const result: Record<string, string> = {}
                                  for (let c of activeCols) {
                                    
                                    result[c.name] = row[c.name]
                                  }

                                  try {
                                    await navigator.clipboard.writeText(JSON.stringify(result))
                                    toast.success("Row copied", { id: "copy-row-json" })
                                  } catch (e) {
                                    toast.error(`Failed to copy row: ${e}`, { id: "copy-row-json" })
                                  }

                                }}
                              >
                                <CurlyBracesIcon className="w-4 h-4"/>
                                Copy as JSON
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => setDeleteRowId(idx)}
                              >
                                <Trash2Icon className="w-4 h-4"/>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TooltipProvider>
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

          <div className="sticky bottom-20 left-0 right-0 h-10 min-h-10 max-h-10 fullwidth flex flex-1 items-center justify-between gap-2 dark:bg-neutral-900 opacity-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border-r w-14 h-10 hover:bg-neutral-800 justify-center">
                <PlusIcon className="w-5 h-5"/>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-0.5">
                <p>{rowCnt} rows total</p>
                <DotIcon className="h-4 w-4" />
                <p>{Math.round(timeMs)}ms</p>
              </div>
            </div>

            <div className="flex items-center gap-8 pr-4">
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

      <AlertDialog
        open={deleteRowId !== null}
        onOpenChange={() => setDeleteRowId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this row from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => delR(deleteRowId!)}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <SheetWrapper
        open={duplicateRowId !== null}
        onOpenChange={() => setDeplicateRowId(null)}
        title="Duplicate row"
        onDiscard={() => setDuplicateRowVals(initialDup)}
        submitButtonText="Duplicate"
        onSubmit={() => dupR()}
        disabled={false}
        bodyClassname="overflow-y-scroll! overflow-x-hide!"
        isDirty={() => JSON.stringify(duplicateRowVals) !== JSON.stringify(data[duplicateRowId!])}
      >
        <>
          {columns.map((c, idx) => (
            <RowSheetOption 
              column={c}
              idx={idx}
              valSetter={setDuplicateRowVals}
              val={duplicateRowVals[c.name]}
            />
          ))}
        </>
      </SheetWrapper>


      <SheetWrapper
        open={editRowId !== null}
        onOpenChange={() => setEditRowId(null)}
        title="Edit row"
        onDiscard={() => setEditRowVals(initialDup)}
        submitButtonText="Apply Changes"
        onSubmit={() => updateR(editRowId!)}
        disabled={JSON.stringify(editRowVals) === JSON.stringify(data[editRowId!])}
        bodyClassname="overflow-y-scroll! overflow-x-hide!"
        isDirty={() => JSON.stringify(editRowVals) !== JSON.stringify(data[editRowId!])}
      >
        <>
          {columns.map((c, idx) => (
            <RowSheetOption 
              column={c}
              idx={idx}
              valSetter={setEditRowVals}
              val={editRowVals[c.name]}
            />
          ))}
        </>
      </SheetWrapper>

      <SheetWrapper
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        title="Add row"
        onDiscard={() => setAddRowVals(initialDup)}
        submitButtonText="Add Row"
        onSubmit={() => addR()}
        disabled={JSON.stringify(addRowVals) === JSON.stringify(initialDup)}
        bodyClassname="overflow-y-scroll! overflow-x-hide!"
        isDirty={() => JSON.stringify(addRowVals) !== JSON.stringify(initialDup)}
      >
        <>
          {columns.map((c, idx) => (
            <RowSheetOption 
              column={c}
              idx={idx}
              valSetter={setEditRowVals}
              val={editRowVals[c.name]}
            />
          ))}
        </>
      </SheetWrapper>
    </>
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
                className={selectedIndex === index ? 'group flex items-center justify-between fullwidth bg-accent text-accent-foreground' : 'group flex items-center justify-between fullwidth hover:bg-accent text-accent-foreground cursor-pointer'}
              >
                <p>{c.name}</p>
                <p 
                  className="hidden group-hover:block text-sm text-muted-foreground cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveCols([c])
                  }}
                >
                  Only
                </p>
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

const RowSheetOption = ({
  column,
  valSetter,
  val,
  idx
}: {
  column: ColumnType,
  valSetter: Dispatch<SetStateAction<any>>,
  idx: number,
  val: any
}) => {
  const Icon = DTypes.find((d) => d.dtype === ALIAS_TO_ENUM[column.dtype]) ? DTypes.find((d) => d.dtype === ALIAS_TO_ENUM[column.dtype])!.icon : TextIcon;

  const lastValidValue = useRef(val);

  // Update the "memory" only when the user types, not when they click NULL
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    lastValidValue.current = newVal; // Remember the typing
    valSetter((p: any) => ({ ...p, [column.name]: newVal }));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="stroke-muted-foreground h-4 w-t"/>
        <h1 className="text-sm text-muted-foreground font-semibod">{column.name}</h1>
        {column.is_nullable && (
          <span className="text-sm text-muted-foreground">
            (optional)
          </span>
        )}
      </div>
        
      <div className="relative fullwidth">
        <Textarea
          placeholder={val==="" ? "NULL" : ""} 
          value={val}
          onChange={handleChange}
          className="fullwidth"
        />

        {column.is_nullable && (
          <div className="absolute bottom-2 right-2 flex gap-2 items-center z-400">
            <Checkbox
              onCheckedChange={checked => {
                if (checked) {
                  valSetter((p: any) => ({ ...p, [column.name]: "" }))
                } else {
                  valSetter((p: any) => ({ ...p, [column.name]: lastValidValue.current }))
                }
              }} 
              className="w-3 h-3"
              id={`nullbox${idx}`}

            />

            <Label htmlFor={`nullbox${idx}`} className="text-muted-foreground text-sm">NULL</Label>
          </div>
        )}
      </div>

    </div>
  )
}

const SortComponent = ({
  activeSorts,
  setActiveSorts,
  columns,
}: {
  activeSorts: ColumnSortType[];
  setActiveSorts: Dispatch<SetStateAction<ColumnSortType[]>>;
  columns: ColumnType[];
}) => {

  console.log("@ACTIVE SORTS: ", activeSorts)

  const [isOpen, setIsOpen] = useState(false);
  const [sorts, setSorts] = useState<ColumnSortType[]>(activeSorts);

  useEffect(() => {
    setSorts(activeSorts)
  }, [activeSorts])

  const activeSortsCols = useMemo(() => {
    return new Set(sorts.map(s => s.column))
  }, [sorts])

  const availableCols = useMemo(() => {
    return columns.filter(c => !activeSortsCols.has(c.name))
  }, [sorts])

  // Clean functional updates - use index correctly
  const updateSort = (index: number, updates: Partial<ColumnSortType>) => {
    setSorts(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const removeSort = (index: number) => {
    setSorts(prev => prev.filter((_, i) => i !== index));
  };

  const addSort = () => {
    setSorts(prev => [...prev, { 
      column: columns[0]?.name || '', 
      dir: "ASC"
    }]);
  };

  const applySort = () => {
    setActiveSorts(sorts);
  };


  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className="relative">
        <Button className="relative flex items-center gap-2" variant="outline">
          <ListOrderedIcon className="w-4 h-4"/>
          <h1>Sorting</h1>
          <div className={`${
            activeSorts.length === 0 && "hidden"
          } absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-background`}> 
            {activeSorts.length} 
          </div> 
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-md p-0 max-h-96 overflow-y-auto">
        <DropdownMenuGroup>
          {sorts.length === 0 && (
            <div className="flex flex-col p-4">
              <h1 className="text-sm">No Sorting Rules</h1>
            </div>
          )}
          {sorts.map((f, index) => (
            <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
              <div className="flex items-center gap-4">
                <Select
                  value={f.column}
                  onValueChange={(v) => {
                    console.log("@NEWCOL: ", v)
                    updateSort(index, { column: v })}
                  }
                >
                  <SelectTrigger className="w-39! min-w-39! max-w-39!">
                    <p>{f.column}</p>
                  </SelectTrigger>
                  <SelectContent className="z-150">
                    <SelectGroup>
                      <SelectLabel>Columns</SelectLabel>
                      {availableCols.map(c => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Label htmlFor="asc" className="text-sm text-muted-foreground">
                      ascending:
                  </Label>
                  <Switch 
                    id="asc"
                    checked={sorts[index].dir === "ASC"}
                    onCheckedChange={checked => {
                      if (checked) {
                        updateSort(index, { dir: "ASC" })
                      } else {
                        updateSort(index, { dir: "DESC" })
                      }
                    }}
                  />
                </div>
              </div>


                  

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeSort(index)}
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
            onClick={addSort}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4"/>
            Add Rule
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={applySort}
            
            disabled={JSON.stringify(sorts) === JSON.stringify(activeSorts)}
          >
            Apply
          </Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}