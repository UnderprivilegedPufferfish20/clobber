"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, ListTreeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createIndexSchema } from "@/lib/types/schemas";
import { DatabaseObjectAddSheetProps, INDEX_TYPES } from "@/lib/types";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { getCols } from "@/lib/actions/database/columns/cache-actions";
import { createIndex } from "@/lib/actions/database/indexes";
import SheetWrapper from "@/components/SheetWrapper";
import SheetTableSelector from "../../../_components/selectors/SheetTableSelector";
import SheetSchemaSelect from "../../../_components/selectors/SheetSchemaSelect";


function AddIndexSheet({
  projectId,
  schemas,
  open,
  onOpenChange
}: DatabaseObjectAddSheetProps) {
  const queryClient = useQueryClient();


  const [schema, setSchema] = useState("")
  const [table, setTable] = useState("")
  const [cols, setCols] = useState<{ name: string, dtype: string }[]>([])
  const [type, setType] = useState<INDEX_TYPES>(INDEX_TYPES.BTREE)


  const tablesQuery = useQuery({
    queryKey: ["tables", projectId, schema],
    queryFn: () => getTables(schema, projectId),
    enabled: Boolean(projectId && schema),
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
    queryKey: ["cols", projectId, schema, table],
    queryFn: () => getCols(schema, projectId, table),
    enabled: Boolean(projectId && schema && table),
    staleTime: 30_000,
  });

  // getCols returns: { name, dtype }[]
  const availableCols = colsQuery.data ?? [];

  const existingColNames = useMemo(() => {
    return cols.map((c) => c?.name?.trim()).filter(Boolean);
  }, [cols]);

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

      setCols(p => [...p, { name: found.name, dtype: found.dtype }])
    },
    [availableCols, cols, existingColNames]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      createIndex(
        {
          cols,
          schema,
          table,
          type
        },
        projectId
      )
    },
    onSuccess: () => {
      toast.success("Index created", { id: "add-index" });

      queryClient.invalidateQueries({
        queryKey: ["indexes", projectId, schema],
      });

      setSchema("")
      setCols([])
      setTable("")
      setType(INDEX_TYPES.BTREE)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create index", { id: "add-index" });
    },
  });

  const previewCols = existingColNames.join(", ");

  return (
    <SheetWrapper
      title="Create Index"
      description="Choose a schema + table, select an index type, and add indexed columns."
      onOpenChange={onOpenChange}
      open={open}
      submitButtonText="Create Index"
      isPending={isPending}
      onDiscard={() => {
        setSchema("")
        setCols([])
        setTable("")
        setType(INDEX_TYPES.BTREE)
      }}
      onSubmit={() => mutate()}
      isDirty={() => Boolean(schema || table) || cols.length > 0}
      disabled={!schema || !table || cols.length === 0}
    >

      <div className="flex flex-col gap-2">
        <h1>Schema</h1>
        <SheetSchemaSelect 
          projectId={projectId}
          onValueChange={setSchema}
          value={schema}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1>Table</h1>
        <SheetTableSelector 
          value={table}
          onValueChange={setTable}
          projectId={projectId}
          schema={schema}
          disabled={!schema}
        />
      </div>


      <div className="flex flex-col gap-2">
        <h1>Type</h1>

        <Select onValueChange={v => setType(v as INDEX_TYPES)} value={type}>
            <SelectTrigger>
              <SelectValue placeholder="Select an index type" />
            </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(INDEX_TYPES).map((t) => (
              <SelectItem key={t} value={t}>
                {t.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Columns</h1>

        <Select
          onValueChange={addColumnByName}
          disabled={
            !table || colsQuery.isLoading || availableCols.length === 0
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !table
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

      {cols.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No columns added yet.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {cols.map((row, index) => {
            const name = cols?.[index]?.name ?? row.name ?? "column";
            const dtype = cols?.[index]?.dtype ?? row.dtype ?? "";
            return (
              <div
                key={Math.random()}
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
                  onClick={() => setCols(p => p.filter((_, i) => i !== index))}
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
          CREATE INDEX ON {schema || "schema"}.
          {table || "table"} USING{" "}
          {(type || INDEX_TYPES.BTREE).toLowerCase()} (
          {previewCols || "col"} );
        </span>
      </div>
      </div>

    </SheetWrapper>
  );
}

export default AddIndexSheet;
