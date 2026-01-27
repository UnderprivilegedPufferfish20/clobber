"use client";

import { DATA_TYPES, FKEY_REFERENCED_ROW_ACTION_DELETED, FKEY_REFERENCED_ROW_ACTION_UPDATED, FkeyColumnType, FkeyType, TableType } from "@/lib/types";
import { Dispatch, SetStateAction, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSchemas } from "@/lib/actions/database/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { getCols } from "@/lib/actions/database/columns/cache-actions";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightIcon, BoxesIcon, Table2Icon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SheetWrapper from "@/components/SheetWrapper";
import SheetSchemaSelect from "../selectors/SheetSchemaSelect";

export default function EditFkeySheet({
  projectId,
  setFkeys,
  table,
  schema,
  open,
  onOpenChange,

  editingFkey,
  index
}: {
  projectId: string,
  setFkeys: Dispatch<SetStateAction<FkeyType[]>>,
  table: TableType,
  schema: string,

  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  editingFkey?: FkeyType,
  index?: number
}) {
  if (!editingFkey || typeof index !== "number") {
    return null
  }

  if (editingFkey.cols.length === 0) throw new Error("No columns in fkey");

  const [selectedSchema, setSelectedSchema] = useState(editingFkey.cols[0].referenceeSchema)
  const [selectedTable, setSelectedTable] = useState(editingFkey.cols[0].referenceeTable)

  const [fkeyCols, setFkeyCols] = useState<FkeyColumnType[]>(editingFkey.cols)

  const [delAction, setDelAction] = useState<FKEY_REFERENCED_ROW_ACTION_DELETED>(editingFkey.deleteAction)
  const [updateAction, setUpdateAction] = useState<FKEY_REFERENCED_ROW_ACTION_UPDATED>(editingFkey.updateAction)

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

  function getReferencorMeta(table: TableType, referencorColumn: string) {
    const col = table.columns.find((c) => c.name === referencorColumn);
    return col ? { dtype: col.dtype, isArray: col.isArray } : null;
  }

  function getReferenceeMeta(
    columns: { name: string; dtype: DATA_TYPES; }[] | undefined,
    referenceeColumn: string
  ) {
    const col = columns?.find((c) => c.name === referenceeColumn);
    return col ? { dtype: col.dtype } : null;
  }


  return (
    <SheetWrapper
      open={open}
      isDirty={() => false}
      onOpenChange={onOpenChange}
      disabled={JSON.stringify({ columns, updateAction, delAction }) === JSON.stringify(editingFkey)}
      onSubmit={() => {
        setFkeys(prev => {
          const next = [...prev];
          next.splice(index!, 1, { cols: fkeyCols, updateAction, deleteAction: delAction }); // replace 1
          return next;
        });

        onOpenChange(false)
      }
      }
      title={`Edit foreign key`}
      submitButtonText="Apply Changes"
      bodyClassname="overflow-y-auto"
      sheetContentClassname="z-250 sm:max-w-md"
    >
      <div className="flex flex-col gap-2">
        <h1>Select schema</h1>

        <SheetSchemaSelect 
          onValueChange={setSelectedSchema}
          value={selectedSchema}
          projectId={projectId}
        />
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


        <div className="flex items-center text-muted-foreground fullwidth justify-between mt-4 pr-10">
          <h4>{schema}.<span className="text-white">{table.name === "" ? "[unnamed]" : table.name}</span></h4>
          <h4>{selectedSchema}.<span className="text-white">{selectedTable}</span></h4>
        </div>

        <div className="flex flex-col gap-2 fullwidth">
          {fkeyCols.map((c, idx) => {

            return (
              <div className="flex items-center gap-2 fullwidth justify-between">
                <Select
                  value={c.referencorColumn}
                  onValueChange={(v) => {
                    const nextReferencor = v;

                    // if current referencee doesn't match the newly selected referencor dtype, clear it
                    const refMeta = getReferencorMeta(table, nextReferencor);
                    const curReferenceeMeta = getReferenceeMeta(columns, c.referenceeColumn);

                    updateColumn(idx, {
                      referencorColumn: nextReferencor,
                      referenceeColumn:
                        refMeta && curReferenceeMeta
                          ? (refMeta.dtype === curReferenceeMeta.dtype
                              ? c.referenceeColumn
                              : "")
                          : "",
                    });
                  }}
                >
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

                <Select 
                  value={c.referenceeColumn} 
                  onValueChange={v => updateColumn(idx, { referenceeColumn: v })}
                  disabled={!c.referencorColumn}
                >
                  <SelectTrigger className="truncate w-38 min-w-38 max-w-38">
                    <SelectValue placeholder="select a column..."/>
                  </SelectTrigger>

                  <SelectContent className="z-500">
                    <SelectGroup>
                      <SelectLabel className="font-bold!">Only matching data types</SelectLabel>
                      {(() => {
                        const refMeta = getReferencorMeta(table, c.referencorColumn);

                        // If no referencor selected yet, show nothing (or show a hint)
                        if (!refMeta) {
                          return (
                            <div className="px-2 py-2 text-sm text-muted-foreground">
                              Select a left column first
                            </div>
                          );
                        }

                        const matching = (columns ?? []).filter(
                          (col) => col.dtype === refMeta.dtype
                        );

                        if (matching.length === 0) {
                          return (
                            <div className="px-2 py-2 text-sm text-muted-foreground">
                              No matching columns in {selectedSchema}.{selectedTable}
                            </div>
                          );
                        }

                        return matching.map((col) => (
                          <SelectItem className="flex items-center gap-2" key={col.name} value={col.name}>
                            <h2>{col.name}</h2>
                            <p className="text-muted-foreground">{col.dtype}</p>
                          </SelectItem>
                        ));
                      })()}

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
    </SheetWrapper>
  )
}