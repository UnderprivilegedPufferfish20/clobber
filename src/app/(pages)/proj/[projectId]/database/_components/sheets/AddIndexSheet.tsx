"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ListTreeIcon } from "lucide-react";

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
import { cn } from "@/lib/utils";

import CustomDialogHeader from "@/components/CustomDialogHeader";
import SchemaPicker from "../SchemaPicker";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { createIndexSchema } from "@/lib/types/schemas";
import { createIndex } from "@/lib/actions/database/actions";
import { INDEX_TYPES } from "@/lib/types";

// ✅ your server actions (or wherever you export them from)
import { getTablesForSchema, getColsForTable } from "@/lib/actions/database/actions";

type FormValues = z.infer<typeof createIndexSchema>;

// field array friendly UI shape
type ColRow = { value: string };
type FormUiValues = Omit<FormValues, "cols"> & { cols: ColRow[] };

function AddIndexSheet({
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

  const { schema, setSchema } = useSelectedSchema({
    projectId,
    schemas,
    persist: true,
  });

  const form = useForm<FormUiValues>({
    resolver: zodResolver(createIndexSchema as any),
    defaultValues: {
      schema: schema ?? (schemas?.[0] ?? "public"),
      table: "",
      type: INDEX_TYPES.BTREE,
      cols: [],
    },
    mode: "onChange",
  });

  const colsArray = useFieldArray({
    control: form.control,
    name: "cols",
  });

  // keep schema in sync with picker
  useEffect(() => {
    const next = schema ?? (schemas?.[0] ?? "public");
    form.setValue("schema", next, { shouldValidate: true, shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, schemas]);

  // ensure initial schema
  useEffect(() => {
    if (!schema && schemas?.length) setSchema(schemas[0]);
  }, [schema, schemas, setSchema]);

  const selectedSchema = form.watch("schema");
  const selectedTable = form.watch("table");

  // ✅ tables dropdown
  const tablesQuery = useQuery({
    queryKey: ["tables", projectId, selectedSchema],
    queryFn: async () => getTablesForSchema(selectedSchema, projectId),
    enabled: Boolean(projectId && selectedSchema),
    staleTime: 30_000,
  });

  const tables = useMemo(() => {
    return (tablesQuery.data ?? [])
      .map((r: any) => r.table_name as string)
      .filter(Boolean)
      .sort();
  }, [tablesQuery.data]);

  // ✅ columns dropdown (depends on schema+table)
  const colsQuery = useQuery({
    queryKey: ["columns", projectId, selectedSchema, selectedTable],
    queryFn: async () => getColsForTable(selectedSchema, selectedTable, projectId),
    enabled: Boolean(projectId && selectedSchema && selectedTable),
    staleTime: 30_000,
  });

  const availableColumns = useMemo(() => {
    return (colsQuery.data ?? [])
      .map((r: any) => r.column_name as string)
      .filter(Boolean)
      .sort();
  }, [colsQuery.data]);

  const existingCols = useMemo(() => {
    return (form.watch("cols") ?? [])
      .map((r) => r?.value?.trim())
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("cols")]);

  const addColumn = useCallback(
    (col: string) => {
      const v = col.trim();
      if (!v) return;

      if (existingCols.includes(v)) {
        toast.error("That column is already added.");
        return;
      }

      colsArray.append({ value: v });
    },
    [colsArray, existingCols]
  );

  // when schema changes, reset table & cols
  useEffect(() => {
    form.setValue("table", "");
    colsArray.replace([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchema]);

  // when table changes, reset cols
  useEffect(() => {
    colsArray.replace([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
    const payload = {
      schema: values.schema,
      table: values.table,
      type: values.type,
      cols: values.cols.map(c => ({ value: c.value.trim()})).filter(Boolean), // ✅ strings for server
    };

    return createIndex(payload, projectId);
  },
    onSuccess: () => {
      toast.success("Index created", { id: "add-index" });
      form.reset({
        schema: selectedSchema,
        table: "",
        type: INDEX_TYPES.BTREE,
        cols: [],
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["indexes", projectId, selectedSchema] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create index", { id: "add-index" });
    },
  });

  const onSubmit = useCallback(
    (values: FormUiValues) => {
      const finalCols = (values.cols ?? [])
        .map((r) => r.value?.trim())
        .filter(Boolean);

      if (!values.table) return toast.error("Pick a table.");
      if (finalCols.length === 0) return toast.error("Add at least one column.");

      toast.loading("Creating index...", { id: "add-index" });
      mutate(values);
    },
    [mutate]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button variant="outline" className="bg-indigo-500 text-white">
            Create Index
          </Button>
        </SheetTrigger>
      )}

      <SheetContent className="sm:max-w-md overflow-y-auto p-3 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader icon={ListTreeIcon} title="Create Index" />
          <SheetDescription>
            Choose a schema + table, select an index type, and add indexed columns.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Schema */}
            <FormField
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schema</FormLabel>
                  <FormControl>
                    <SchemaPicker
                      schemas={schemas ?? []}
                      value={schema}
                      onChange={(v) => {
                        setSchema(v);
                        field.onChange(v);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Table dropdown */}
            <FormField
              control={form.control}
              name="table"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <FormDescription>Select a table in this schema.</FormDescription>

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
                    <p className="text-sm text-destructive">
                      Failed to load tables.
                    </p>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Index type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Index Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an index type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent  className="z-200">
                      {Object.values(INDEX_TYPES).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Columns dropdown + list */}
            <FormField
              control={form.control}
              name="cols"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <FormLabel>Columns</FormLabel>
                      <FormDescription>
                        Add one or more columns to include in the index.
                      </FormDescription>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Select
                      onValueChange={(v) => addColumn(v)}
                      disabled={!selectedTable || colsQuery.isLoading || availableColumns.length === 0}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue
                          placeholder={
                            !selectedTable
                              ? "Pick a table first"
                              : colsQuery.isLoading
                              ? "Loading columns..."
                              : availableColumns.length === 0
                              ? "No columns found"
                              : "Select a column"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent  className="z-200">
                        {availableColumns.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={!selectedTable || availableColumns.length === 0}
                      onClick={() => {
                        // optional: do nothing; columns added via dropdown selection
                        toast.message("Pick a column from the dropdown to add it.");
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {colsArray.fields.length === 0 ? (
                    <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      No columns added yet.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {colsArray.fields.map((row, index) => (
                        <div
                          key={row.id}
                          className={cn(
                            "rounded-md border bg-background p-2",
                            "flex items-center justify-between gap-2"
                          )}
                        >
                          <div className="font-mono text-sm truncate">
                            {form.watch(`cols.${index}.value`) || "column"}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => colsArray.remove(index)}
                            aria-label="Remove column"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    Preview:{" "}
                    <span className="font-mono text-foreground">
                      CREATE INDEX ON {selectedSchema || "schema"}.
                      {selectedTable || "table"} USING{" "}
                      {(form.watch("type") || INDEX_TYPES.BTREE).toLowerCase()} (
                      {(form.watch("cols") ?? [])
                        .map((r) => r.value?.trim())
                        .filter(Boolean)
                        .join(", ")}
                      );
                    </span>
                  </div>

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
                "Create Index"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default AddIndexSheet;