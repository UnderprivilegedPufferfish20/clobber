"use client";

import { useMemo, useState } from "react";
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
  DatabaseObjectAddSheetProps,
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATION,
  TRIGGER_TYPE,
} from "@/lib/types";
import { getFunctions } from "@/lib/actions/database/functions/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { createTrigger } from "@/lib/actions/database/triggers";
import SheetWrapper from "@/components/SheetWrapper";


function toggleEnumInArray<T extends string>(arr: T[] | undefined, v: T) {
  const list = arr ?? [];
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function AddTriggerSheet({
  projectId,
  schemas,
  open,
  onOpenChange,
}: DatabaseObjectAddSheetProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("")
  const [selectedSchema, setSelectedSchema] = useState("")
  const [selectedTable, setSelectedTable] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<typeof TRIGGER_EVENTS[keyof typeof TRIGGER_EVENTS][]>([])
  const [selectedType, setSelectedType] = useState<typeof TRIGGER_TYPE[keyof typeof TRIGGER_TYPE]>(TRIGGER_TYPE.BEFORE)
  const [selectedOrientation, setSelectedOrientation] = useState<typeof TRIGGER_ORIENTATION[keyof typeof TRIGGER_ORIENTATION]>(TRIGGER_ORIENTATION.ROW)
  const [selectedFnSchema, setSelectedFnSchema] = useState("")
  const [selectedFnName, setSelectedFnName] = useState("")

  // tables dropdown
  const tablesQuery = useQuery({
    queryKey: ["tables", projectId, selectedSchema],
    queryFn: async () => getTables(selectedSchema, projectId),
    enabled: Boolean(projectId && selectedSchema),
    staleTime: 30_000,
  });

  const tables = useMemo(() => {
    return (tablesQuery.data ?? [])
      .filter(Boolean)
      .sort();
  }, [tablesQuery.data]);

  const functionsQuery = useQuery({
    queryKey: ["functions", projectId, selectedFnSchema],
    queryFn: async () => getFunctions(projectId, selectedFnSchema),
    enabled: Boolean(projectId && selectedFnSchema),
    staleTime: 30_000,
  });

  const availableFunctions = useMemo(() => {
    return (functionsQuery.data ?? [])
      .map((r: any) => r.function_name as string)
      .filter(Boolean)
      .sort();
  }, [functionsQuery.data]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => createTrigger({
      name,
      event: selectedEvents,
      functionName: selectedFnName,
      functionSchema: selectedFnSchema,
      orientation: selectedOrientation,
      schema: selectedSchema,
      table: selectedTable,
      type: selectedType
    }, projectId),
    onSuccess: () => {
      toast.success("Trigger created", { id: "add-trigger" });
      queryClient.invalidateQueries({ queryKey: ["triggers", projectId, selectedSchema] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create trigger", { id: "add-trigger" });
    },
  });

  return (
    <SheetWrapper
      title="Create Trigger"
      description="Choose a table, pick events, timing, and the function to run."
      onSubmit={() => mutate()}
      disabled={false}
      onOpenChange={onOpenChange}
      open={open}
      submitButtonText="Create Trigger"
      isPending={isPending}
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

      <div className="flex flex-col gap-2">
        <h1>Schema</h1>

        <Select onValueChange={v => setSelectedSchema(v)} value={selectedSchema}>
            <SelectTrigger>
              <SelectValue placeholder="Select schema" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {(schemas ?? []).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h1>Table</h1>

        <Select
          onValueChange={v => setSelectedTable(v)}
          value={selectedTable}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                tablesQuery.isLoading
                  ? "Loading tables..."
                  : tables.length === 0
                  ? "No tables found"
                  : "Select a table"
              }
            />
          </SelectTrigger>
          <SelectContent className="z-200">
            {tables.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {tablesQuery.isError && (
          <p className="text-sm text-destructive">Failed to load tables.</p>
        )}
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
            <SelectTrigger>
              <SelectValue placeholder="Select timing" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(TRIGGER_TYPE).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Orientation</h1>
          
        <Select onValueChange={v => setSelectedOrientation(v as TRIGGER_ORIENTATION)} value={selectedOrientation}>
            <SelectTrigger>
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(TRIGGER_ORIENTATION).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h1>Function Schema</h1>

        <Select onValueChange={setSelectedFnSchema} value={selectedFnSchema}>
            <SelectTrigger>
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(TRIGGER_ORIENTATION).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
          <h1>Function Name</h1>

          <Select
            onValueChange={setSelectedFnName}
            value={selectedFnName}
            disabled={functionsQuery.isLoading || availableFunctions.length === 0}
          >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    functionsQuery.isLoading
                      ? "Loading functions..."
                      : availableFunctions.length === 0
                      ? "No trigger functions found"
                      : "Select a function"
                  }
                />
              </SelectTrigger>

            <SelectContent className="z-200">
              {availableFunctions.map((fn) => (
                <SelectItem key={fn} value={fn}>
                  {fn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {functionsQuery.isError && (
            <p className="text-sm text-destructive">Failed to load functions.</p>
          )}
      </div>


    </SheetWrapper>

      

            
           
             
  )
}

export default AddTriggerSheet;