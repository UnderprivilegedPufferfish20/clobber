"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PlayCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

import CustomDialogHeader from "@/components/CustomDialogHeader";

import { createTriggerSchema } from "@/lib/types/schemas";
import {
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATION,
  TRIGGER_TYPE,
} from "@/lib/types";
import { getFunctions } from "@/lib/actions/database/functions/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { createTrigger } from "@/lib/actions/database/triggers";

type FormValues = z.infer<typeof createTriggerSchema>;

function toggleEnumInArray<T extends string>(arr: T[] | undefined, v: T) {
  const list = arr ?? [];
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function AddTriggerSheet({
  projectId,
  schemas,
  open,
  onOpenChange,
  hideTrigger,
}: {
  hideTrigger: boolean;
  projectId: string;
  schemas: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(createTriggerSchema),
    defaultValues: {
      name: "",
      schema: schemas?.[0] ?? "public",
      table: "",
      event: [],
      type: TRIGGER_TYPE.BEFORE,
      orientation: TRIGGER_ORIENTATION.ROW,
      functionSchema: schemas?.[0] ?? "public",
      functionName: "",
    },
    mode: "onChange",
  });

  const selectedSchema = form.watch("schema");
  const selectedFnSchema = form.watch("functionSchema");

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

  // when function schema changes, reset function name
  useEffect(() => {
    form.setValue("functionName", "", { shouldValidate: true, shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFnSchema]);

  // when schema changes, reset table
  useEffect(() => {
    form.setValue("table", "", { shouldValidate: true, shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchema]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => createTrigger(values, projectId),
    onSuccess: () => {
      toast.success("Trigger created", { id: "add-trigger" });
      form.reset({
        name: "",
        schema: selectedSchema,
        table: "",
        event: [],
        type: TRIGGER_TYPE.BEFORE,
        orientation: TRIGGER_ORIENTATION.ROW,
        functionSchema: selectedSchema,
        functionName: "",
      });
      onOpenChange(false);

      queryClient.invalidateQueries({ queryKey: ["triggers", projectId, selectedSchema] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create trigger", { id: "add-trigger" });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!values.table) return toast.error("Pick a table.");
    if (!values.name?.trim()) return toast.error("Enter a trigger name.");
    if (!values.event?.length) return toast.error("Pick at least one event.");
    if (!values.functionName?.trim()) return toast.error("Enter a function name.");

    toast.loading("Creating trigger...", { id: "add-trigger" });
    mutate({
      ...values,
      name: values.name.trim(),
      functionName: values.functionName.trim(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button variant="outline" className="bg-indigo-500 text-white">
            Create Trigger
          </Button>
        </SheetTrigger>
      )}

      <SheetContent className="sm:max-w-md overflow-y-auto p-3 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader icon={PlayCircleIcon} title="Create Trigger" />
          <SheetDescription>
            Choose a schema + table, pick events, timing, and the function to run.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. audit_users_changes" {...field} />
                  </FormControl>
                  <FormDescription>
                    1–15 chars. Used as the trigger identifier in Postgres.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schema */}
            <FormField
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Schema</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-200">
                      {(schemas ?? []).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Table */}
            <FormField
              control={form.control}
              name="table"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <FormDescription>
                    Select a table in &apos;{selectedSchema}&apos; to attach the trigger to.
                  </FormDescription>

                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={tablesQuery.isLoading || tables.length === 0}
                  >
                    <FormControl>
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
                    </FormControl>
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

                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Events (array enum) */}
            <FormField
              control={form.control}
              name="event"
              render={({ field }) => {
                const selected = field.value ?? [];
                return (
                  <FormItem>
                    <FormLabel>Events</FormLabel>
                    <FormDescription>
                      Choose which operations will fire this trigger.
                    </FormDescription>

                    <div className="flex flex-col gap-2">
                      {[TRIGGER_EVENTS.INSERT, TRIGGER_EVENTS.UPDATE, TRIGGER_EVENTS.DELETE].map(
                        (ev) => {
                          const checked = selected.includes(ev);
                          return (
                            <div key={ev} className="flex items-center gap-2">
                              <Checkbox
                                id={`ev-${ev}`}
                                checked={checked}
                                onCheckedChange={() => field.onChange(toggleEnumInArray(selected, ev))}
                              />
                              <Label htmlFor={`ev-${ev}`} className="font-semibold">
                                {ev}
                              </Label>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Type (BEFORE/AFTER) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timing</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-200">
                      {Object.values(TRIGGER_TYPE).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Orientation (ROW/STATEMENT) */}
            <FormField
              control={form.control}
              name="orientation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orientation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-200">
                      {Object.values(TRIGGER_ORIENTATION).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ROW triggers run per row; STATEMENT triggers run once per statement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Function schema */}
            <FormField
              control={form.control}
              name="functionSchema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Function Schema</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select function schema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-200">
                      {(schemas ?? []).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Function name */}
            <FormField
              control={form.control}
              name="functionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Function</FormLabel>
                  <FormDescription>
                    Only functions that return <span className="font-mono">trigger</span> in schema{" "}
                    <span className="font-mono">{selectedFnSchema}</span> are shown.
                  </FormDescription>

                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={functionsQuery.isLoading || availableFunctions.length === 0}
                  >
                    <FormControl>
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
                    </FormControl>

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

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Trigger"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default AddTriggerSheet;