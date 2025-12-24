"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, ListTreeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { createIndexSchema } from "@/lib/types/schemas";
import { createIndex } from "@/lib/actions/database/actions";
import { INDEX_TYPES } from "@/lib/types";
import { getCols, getTables } from "@/lib/actions/database/getActions";

type FormValues = z.infer<typeof createIndexSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(createIndexSchema as any),
    defaultValues: {
      schema: schemas?.[0] ?? "public",
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

  const selectedSchema = useWatch({ control: form.control, name: "schema" });
  const selectedTable = useWatch({ control: form.control, name: "table" });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const watchedCols = useWatch({ control: form.control, name: "cols" }) ?? [];

  // Keep schema valid if prop changes
  useEffect(() => {
    if (!schemas?.length) return;
    const current = form.getValues("schema");
    if (!current || !schemas.includes(current)) {
      form.setValue("schema", schemas[0], { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemas]);

  // Reset dependent fields when schema changes
  useEffect(() => {
    form.setValue("table", "", { shouldValidate: true });
    colsArray.replace([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchema]);

  // Reset cols when table changes
  useEffect(() => {
    colsArray.replace([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const tablesQuery = useQuery({
    queryKey: ["tables", projectId, selectedSchema],
    queryFn: () => getTables(selectedSchema, projectId),
    enabled: Boolean(projectId && selectedSchema),
    staleTime: 30_000,
  });

  // normalize tables to string[]
  const tables = useMemo(() => {
    const raw = tablesQuery.data ?? [];
    return raw
      .map((t: any) => (typeof t === "string" ? t : t?.table_name))
      .filter(Boolean) as string[];
  }, [tablesQuery.data]);

  const colsQuery = useQuery({
    queryKey: ["cols", projectId, selectedSchema, selectedTable],
    queryFn: () => getCols(selectedSchema, projectId, selectedTable),
    enabled: Boolean(projectId && selectedSchema && selectedTable),
    staleTime: 30_000,
  });

  // getCols returns: { name, dtype }[]
  const availableCols = colsQuery.data ?? [];

  const existingColNames = useMemo(() => {
    return watchedCols.map((c) => c?.name?.trim()).filter(Boolean);
  }, [watchedCols]);

  const addColumnByName = useCallback(
    (colName: string) => {
      const name = (colName ?? "").trim();
      if (!name) return;

      if (existingColNames.includes(name)) {
        toast.error("That column is already added.");
        return;
      }

      const found = availableCols.find((c: any) => c.name === name);
      if (!found) {
        toast.error("Column not found.");
        return;
      }

      colsArray.append({ name: found.name, dtype: found.dtype });
    },
    [availableCols, colsArray, existingColNames]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => createIndex(values, projectId),
    onSuccess: () => {
      toast.success("Index created", { id: "add-index" });

      form.reset({
        schema: selectedSchema,
        table: "",
        type: INDEX_TYPES.BTREE,
        cols: [],
      });

      onOpenChange(false);

      queryClient.invalidateQueries({
        queryKey: ["indexes", projectId, selectedSchema],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create index", { id: "add-index" });
    },
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      toast.loading("Creating index...", { id: "add-index" });
      mutate(values);
    },
    [mutate]
  );

  const previewCols = existingColNames.join(", ");

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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a schema" />
                      </SelectTrigger>
                      <SelectContent className="z-200">
                        {schemas.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                    <p className="text-sm text-destructive">Failed to load tables.</p>
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
                    <SelectContent className="z-200">
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

            {/* Columns */}
            <FormField
              control={form.control}
              name="cols"
              render={() => (
                <FormItem>
                  <FormLabel>Columns</FormLabel>
                  <FormDescription>
                    Select one or more columns to include in the index.
                  </FormDescription>

                  <div className="mt-3">
                    <Select
                      onValueChange={addColumnByName}
                      disabled={
                        !selectedTable || colsQuery.isLoading || availableCols.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !selectedTable
                              ? "Pick a table first"
                              : colsQuery.isLoading
                              ? "Loading columns..."
                              : availableCols.length === 0
                              ? "No columns found"
                              : "Select a column to add"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent className="z-200">
                        {availableCols.map((c: any) => (
                          <SelectItem
                            key={c.name}
                            value={c.name}
                            className="flex items-center justify-between"
                          >
                            <span>{c.name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {c.dtype}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {colsQuery.isError && (
                      <p className="mt-2 text-sm text-destructive">
                        Failed to load columns.
                      </p>
                    )}
                  </div>

                  {colsArray.fields.length === 0 ? (
                    <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      No columns added yet.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {colsArray.fields.map((row, index) => {
                        const name = watchedCols?.[index]?.name ?? row.name ?? "column";
                        const dtype = watchedCols?.[index]?.dtype ?? row.dtype ?? "";
                        return (
                          <div
                            key={row.id}
                            className={cn(
                              "rounded-md border bg-background p-2",
                              "flex items-center justify-between gap-2"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="font-mono text-sm truncate">{name}</div>
                              {dtype ? (
                                <div className="text-xs text-muted-foreground truncate">
                                  {dtype}
                                </div>
                              ) : null}
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
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    Preview:{" "}
                    <span className="font-mono text-foreground">
                      CREATE INDEX ON {selectedSchema || "schema"}.
                      {selectedTable || "table"} USING{" "}
                      {(selectedType || INDEX_TYPES.BTREE).toLowerCase()} (
                      {previewCols || "col"} );
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
