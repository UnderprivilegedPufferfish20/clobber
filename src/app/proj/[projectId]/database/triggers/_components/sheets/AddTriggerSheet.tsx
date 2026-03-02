"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATION,
  TRIGGER_TYPE,
} from "@/lib/types";
import { getFunctions } from "@/lib/actions/database/functions/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { createTrigger } from "@/lib/actions/database/triggers";
import SheetWrapper from "@/components/SheetWrapper";
import SheetSchemaSelect from "../../../_components/selectors/SheetSchemaSelect";
import SheetTableSelector from "../../../_components/selectors/SheetTableSelector";
import { BetweenHorizonalStartIcon, BetweenVerticalStart, FunctionSquareIcon, HistoryIcon, TableColumnsSplitIcon } from "lucide-react";
import FunctionSelectSheet from "./FunctionSelectSheet";
import { Button } from "@/components/ui/button";
import TableSelectSheet from "@/components/TableSelectSheet";


function toggleEnumInArray<T extends string>(arr: T[] | undefined, v: T) {
  const list = arr ?? [];
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function AddTriggerSheet({
  projectId,
  open,
  onOpenChange,
  schemas
}: {
  projectId: string,
  open: boolean, 
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  schemas: string[]
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("")
  const [selectedSchema, setSelectedSchema] = useState("")
  const [selectedTable, setSelectedTable] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<typeof TRIGGER_EVENTS[keyof typeof TRIGGER_EVENTS][]>([])
  const [selectedType, setSelectedType] = useState<typeof TRIGGER_TYPE[keyof typeof TRIGGER_TYPE]>(TRIGGER_TYPE.BEFORE)
  const [selectedOrientation, setSelectedOrientation] = useState<typeof TRIGGER_ORIENTATION[keyof typeof TRIGGER_ORIENTATION]>(TRIGGER_ORIENTATION.ROW)
  const [selectedFnSchema, setSelectedFnSchema] = useState("")
  const [selectedFnName, setSelectedFnName] = useState("")


  const [isFuncOpen, setIsFuncOpen] = useState(false)
  const [isTableSelectOpen, setIsTableSelectOpen] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => createTrigger({
      name,
      event: selectedEvents,
      function_name: selectedFnName,
      function_schema: selectedFnSchema,
      orientation: selectedOrientation,
      schema: selectedSchema,
      table: selectedTable,
      type: selectedType
    }, projectId),
    onSuccess: () => {
      toast.success("Trigger created", { id: "add-trigger" });
      queryClient.invalidateQueries({ queryKey: ["triggers", projectId, selectedSchema] });

      setName("")
      setSelectedEvents([])
      setSelectedFnName("")
      setSelectedFnSchema("")
      setSelectedOrientation(TRIGGER_ORIENTATION.ROW)
      setSelectedTable("")
      setSelectedType(TRIGGER_TYPE.BEFORE)
      setSelectedSchema("")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create trigger", { id: "add-trigger" });
    },
  });

  const isDirty = () => {
    return Boolean(name || selectedSchema || selectedTable || selectedType !== "BEFORE" || selectedOrientation !== "ROW" || selectedFnSchema || selectedFnName || selectedEvents.length > 0)
  }

  return (

    
    <SheetWrapper
      title="Create Trigger"
      description="Choose a table, pick events, timing, and the function to run."
      onSubmit={() => mutate()}
      disabled={!isDirty() || !(selectedEvents.length > 0) || !(selectedFnName || selectedFnSchema) || !(selectedTable)}
      onOpenChange={onOpenChange}
      open={open}
      onDiscard={() => {
        setName("")
        setSelectedEvents([])
        setSelectedFnName("")
        setSelectedFnSchema("")
        setSelectedOrientation(TRIGGER_ORIENTATION.ROW)
        setSelectedTable("")
        setSelectedType(TRIGGER_TYPE.BEFORE)
        setSelectedSchema("")
      }}
      submitButtonText="Create Trigger"
      isPending={isPending}
      isDirty={isDirty}
    >
      <div className='flex flex-col gap-2'>
        <h1>Name</h1>
        <Input 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='e.g. user_email'
          id='column-name'
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h1>Table</h1>
        <TableSelectSheet 
          table={selectedTable}
          schema={selectedSchema}
          projectId={projectId}
          schemas={schemas}
          setSchema={setSelectedSchema}
          setTable={setSelectedTable}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1>Actions</h1>
        <div className="flex flex-col gap-2">
          {[TRIGGER_EVENTS.INSERT, TRIGGER_EVENTS.UPDATE, TRIGGER_EVENTS.DELETE].map(
            (ev) => {
              const checked = selectedEvents.includes(ev);
              return (
                <div key={ev} className="flex items-center gap-2">
                  <Checkbox
                    id={`ev-${ev}`}
                    checked={checked}
                    onCheckedChange={() => setSelectedEvents(toggleEnumInArray(selectedEvents, ev))}
                  />
                  <Label htmlFor={`ev-${ev}`} className="font-semibold">
                    {ev}
                  </Label>
                </div>
              );
            }
          )}
        </div>

      </div>

      <div className="flex flex-col gap-2">
        <h1>Timing</h1>

        <Select onValueChange={v => setSelectedType(v as TRIGGER_TYPE)} value={selectedType}>
            <SelectTrigger className="fullwidth">
              <SelectValue placeholder="Select timing" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(TRIGGER_TYPE).map((t) => (
              <SelectItem key={t} value={t}>
                {t === "BEFORE" && (
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4"/>
                    {t.toWellFormed()}
                  </div>
                )}
                {t === "AFTER" && (
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 transform -scale-x-100"/>
                    {t}
                  </div>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Orientation</h1>
          
        <Select onValueChange={v => setSelectedOrientation(v as TRIGGER_ORIENTATION)} value={selectedOrientation}>
            <SelectTrigger className="fullwidth">
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(TRIGGER_ORIENTATION).map((o) => (
              <SelectItem key={o} value={o}>
                {o === "ROW" && (
                  <div className="flex items-center gap-2">
                    <BetweenHorizonalStartIcon className="w-4 h-4"/>
                    {o}
                  </div>
                )}
                {o === "STATEMENT" && (
                  <div className="flex items-center gap-2">
                    <BetweenVerticalStart className="w-4 h-4 transform"/>
                    {o}
                  </div>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h1>Function</h1>
        
        <FunctionSelectSheet
          schemas={schemas}
          name={selectedFnName}
          schema={selectedFnSchema}
          setFunctionSchema={setSelectedFnSchema}
          setFunction={setSelectedFnName}
          projectId={projectId} 
          makeTriggerPageOpen={onOpenChange}
        />
      </div>
    </SheetWrapper> 
  )
}

export default AddTriggerSheet;