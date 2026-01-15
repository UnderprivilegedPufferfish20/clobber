"use client";

import { DATA_TYPES, FKEY_REFERENCED_ROW_ACTION_DELETED, FKEY_REFERENCED_ROW_ACTION_UPDATED, FkeyColumnType, FkeyType, TableType } from "@/lib/types";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useQuery } from "@tanstack/react-query";
import { getSchemas } from "@/lib/actions/database/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { getCols } from "@/lib/actions/database/columns/cache-actions";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightIcon, BoxesIcon, Table2Icon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddFkeySheet({
  projectId,
  setFkeys,
  table,
  schema,
  open,
  onOpenChange
}: {
  projectId: string,
  setFkeys: Dispatch<SetStateAction<FkeyType[]>>,
  table: TableType,
  schema: string,

  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {

  

  const [selectedSchema, setSelectedSchema] = useState("")
  const [selectedTable, setSelectedTable] = useState("")

  const [fkeyCols, setFkeyCols] = useState<FkeyColumnType[]>([])

  const [delAction, setDelAction] = useState<FKEY_REFERENCED_ROW_ACTION_DELETED>(FKEY_REFERENCED_ROW_ACTION_DELETED.NONE)
  const [updateAction, setUpdateAction] = useState<FKEY_REFERENCED_ROW_ACTION_UPDATED>(FKEY_REFERENCED_ROW_ACTION_UPDATED.NONE)

  const { data: schemas } = useQuery({
    queryKey: ["schemas", projectId],
    queryFn: () => getSchemas(projectId)
  })

  const { data: tables } = useQuery({
    queryKey: ["tables", projectId, selectedSchema],
    queryFn: () => getTables(selectedSchema, projectId),
    enabled: Boolean(selectedSchema)
  })

  const { data: columns } = useQuery({
    queryKey: ["columns", projectId, selectedSchema, selectedTable],
    queryFn: () => getCols(selectedSchema, projectId, selectedTable),
    enabled: Boolean(selectedSchema) && Boolean(selectedTable)
  })

  function deleteColumn(idx: number) {
    setFkeyCols((prev) => {
      const col = prev[idx];
      if (!col) return prev;

      return prev.filter((_, i) => i !== idx);
    });
  }

  function updateColumn(idx: number, patch: Partial<FkeyColumnType>) {
    setFkeyCols((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  const defaultColumn: FkeyColumnType = {
    referenceeSchema: selectedSchema ?? "",
    referenceeTable: selectedTable ?? "",
    referenceeColumn: "",
    
    referencorSchema: schema,
    referencorTable: table.name,
    referencorColumn: ""
  }

  const handleClose = () => {
    setFkeyCols([])
    setDelAction(FKEY_REFERENCED_ROW_ACTION_DELETED.NONE)
    setUpdateAction(FKEY_REFERENCED_ROW_ACTION_UPDATED.NONE)
    setSelectedTable("")
    setSelectedSchema("")

    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="p-0! z-250 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add foreign key to {table.name}</SheetTitle>
          <SheetDescription>Enhances data integrity</SheetDescription>
        </SheetHeader>
        
        <Separator />

        <div className="space-y-6 p-6 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <h1>Select schema</h1>

            <Select value={selectedSchema} onValueChange={setSelectedSchema}>
              <SelectTrigger className="fullwidth">
                <SelectValue placeholder="select a schema..."/>
              </SelectTrigger>

              <SelectContent className="z-500">
                {schemas && schemas.map(s => (
                  <SelectItem
                    className="flex items-center gap-2" 
                    key={s} 
                    value={s}
                  >
                    <BoxesIcon className="w-6 h-6"/>
                    <h2 className="font-semibold text-lg">{s}</h2>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`${!selectedSchema && "hidden"} flex flex-col gap-2`}>
            <h1>Select table</h1>


            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="fullwidth">
                <SelectValue placeholder="select a table..."/>
              </SelectTrigger>

              <SelectContent className="z-500">
                {tables && tables.map(s => (
                  <SelectItem
                    className="flex items-center gap-2" 
                    key={s} 
                    value={s}
                  >
                    <Table2Icon className="w-6 h-6"/>
                    <h2 className="font-semibold text-lg">{s}</h2>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`${!selectedTable && "hidden"} flex flex-col gap-1`}>
            <Separator />
            <h1 className="mt-4">Columns</h1>

            {!fkeyCols.
              every(c => {
                columns?.find(referenceeCol => referenceeCol.name === c.referenceeColumn)?.dtype 
                === table.columns.find(referencorCol => referencorCol.name === c.referencorColumn)?.dtype
                }
              )
            && (
              <div className="bg-yellow-200/20 fullwidth rounded-lg flex p-2 gap-2 items-center">
                <TriangleAlertIcon className="w-6 h-6" />
                Columns must have matching data types
              </div>
            )}


            <div className="flex items-center text-muted-foreground fullwidth justify-between mt-4 pr-10">
              <h4>{schema}.<span className="text-white">{table.name === "" ? "[unnamed]" : table.name}</span></h4>
              <h4>{selectedSchema}.<span className="text-white">{selectedTable}</span></h4>
            </div>

            <div className="flex flex-col gap-2 fullwidth">
              {fkeyCols.map((c, idx) => {

                return (
                  <div className="flex items-center gap-2 fullwidth justify-between">
                    <Select value={c.referencorColumn} onValueChange={v => updateColumn(idx, { referencorColumn: v })}>
                      <SelectTrigger className="truncate w-38 min-w-38 max-w-38">
                        <SelectValue placeholder="select a column..."/>
                      </SelectTrigger>

                      <SelectContent className="z-500">
                        {table.columns.filter(c => !c.isArray).map(c => (
                          <SelectItem
                            className="flex items-center justify-between fullwidth" 
                            key={c.name} 
                            value={c.name}
                          >
                            <h2>{c.name}</h2>
                            <p className="text-muted-foreground">{c.dtype}</p>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <ArrowRightIcon className="h-6 w-6"/>

                    <Select value={c.referenceeColumn} onValueChange={v => updateColumn(idx, { referenceeColumn: v })}>
                      <SelectTrigger className="truncate w-38 min-w-38 max-w-38">
                        <SelectValue placeholder="select a column..."/>
                      </SelectTrigger>

                      <SelectContent className="z-500">
                        <SelectGroup>
                          <SelectLabel className="font-bold!">Only matching data types</SelectLabel>
                          {columns && columns.map(c => (
                            <SelectItem
                              className="flex items-center gap-2" 
                              key={c.name} 
                              value={c.name}
                            >
                              <h2>{c.name}</h2>
                              <p className="text-muted-foreground">{c.dtype}</p>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Button
                      variant={"ghost"}
                      onClick={() => deleteColumn(idx)}
                      size={"icon-sm"}
                    >
                      <XIcon className="w-6 h-6"/>
                    </Button>
                  </div>
                )
              })}    
            </div>

            <div
              className={`flex items-center justify-center fullwidth relative rounded-md border border-border py-2 mt-2`}
            >
              <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setFkeyCols(p => [...p, defaultColumn])}>
                Add Relation Column
              </Button>
            </div>
          </div>

          <div className={`${!selectedTable && "hidden"} flex flex-col gap-6`}>
            <Separator />
            <div className="flex flex-col gap-2 mt-3">
              <h1>Action if referenced row is updated</h1>

              <Select value={updateAction} onValueChange={v => setUpdateAction(v as typeof FKEY_REFERENCED_ROW_ACTION_UPDATED[keyof typeof FKEY_REFERENCED_ROW_ACTION_UPDATED ])}>
                <SelectTrigger className="fullwidth">
                  <SelectValue placeholder="select a schema..."/>
                </SelectTrigger>

                <SelectContent className="z-500">
                  {Object.values(FKEY_REFERENCED_ROW_ACTION_UPDATED).map(s => (
                    <SelectItem 
                      key={s} 
                      value={s}
                    >
                      <h2>{s}</h2>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={`${!selectedSchema && "hidden"} flex flex-col gap-2`}>
              <h1>Action if referenced row is removed</h1>


              <Select value={delAction} onValueChange={v => setDelAction(v as typeof FKEY_REFERENCED_ROW_ACTION_DELETED[keyof typeof FKEY_REFERENCED_ROW_ACTION_DELETED ])}>
                <SelectTrigger className="fullwidth">
                  <SelectValue placeholder="select a table..."/>
                </SelectTrigger>

                <SelectContent className="z-500">
                  {Object.values(FKEY_REFERENCED_ROW_ACTION_DELETED).map(s => (
                    <SelectItem
                      key={s} 
                      value={s}
                    >
                      <h2>{s}</h2>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
        

        <div className="bg-black w-full overflow-hidden flex items-center justify-end sticky bottom-0 border-t gap-2 p-3 pr-6 h-18 min-h-18 max-h-18">
          <SheetClose asChild>
            <Button variant={"secondary"}>
              Cancel
            </Button>
          </SheetClose>
          <Button 
            onClick={() => {
              setFkeys(p => [...p, {
                cols: fkeyCols,
                updateAction,
                deleteAction: delAction
              }]);
              handleClose()
            }} 
            variant={"default"} 
            disabled={!fkeyCols.every(c => Boolean(c.referenceeColumn) && Boolean(c.referencorColumn)) || !selectedTable || fkeyCols.length === 0}
          >
            Add Relation
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}