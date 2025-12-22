"use client";

import { Separator } from "@/components/ui/separator";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { getFunctions, getSchemas } from "@/lib/actions/database/actions";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import SchemaPicker from "../SchemaPicker";
import { Input } from "@/components/ui/input";
import AddFunctionSheet from "../sheets/AddFunctionSheet";
import Loader from "@/components/Loader";
import { InboxIcon, Search, FunctionSquare } from "lucide-react";
import { DATA_TYPES } from "@/lib/types";
import { mapPostgresType } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
};

const FunctionsPage = ({ projectId }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const {
    data: schemas,
    isLoading: schemasLoading,
    isError: schemasError,
    error: schemasErrObj,
  } = useQuery({
    queryKey: ["schemas", projectId],
    queryFn: () => getSchemas(projectId),
    enabled: !!projectId,
  });

  const { schema, setSchema } = useSelectedSchema({
    projectId,
    schemas,
    persist: true,
  });

  useEffect(() => {
    if (!schema && schemas && schemas.length > 0) {
      setSchema(schemas[0]);
    }
  }, [schemas, schema, setSchema]);

  const { data: functions, isLoading: functionsLoading } = useQuery({
    queryKey: ["functions", projectId, schema],
    queryFn: () => getFunctions(projectId, schema),
    enabled: !!projectId && !!schema,
  });

  const filteredFuncs = useMemo(() => {
    if (!functions) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return functions;

    return functions.filter((f) =>
      f.function_name.toLowerCase().includes(q)
    );
  }, [searchTerm, functions]);

  const showEmptySchemaState = !functionsLoading && !searchTerm && (functions?.length ?? 0) === 0;
  const showNoMatchesState = !functionsLoading && !!searchTerm && filteredFuncs.length === 0;

  return (
    <div className="fullscreen flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl">Functions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Functions are reusable bits of code that do a specific job.
          </p>
        </div>

        <AddFunctionSheet
          open={open}
          onOpenChange={setOpen}
          projectId={projectId}
          schemas={schemas ?? []}
          hideTrigger={false}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 mb-4 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full sm:w-72"
              placeholder="Search functions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <SchemaPicker schemas={schemas ?? []} value={schema} onChange={setSchema} />
        </div>

        <div className="text-xs text-muted-foreground">
          {functionsLoading ? "Loading…" : `${filteredFuncs.length} function${filteredFuncs.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* CONTENT */}
      {functionsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader sz={86} />
        </div>
      ) : showEmptySchemaState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <InboxIcon size={96} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">No functions in “{schema}”</h2>
            <p className="text-muted-foreground text-sm">
              Create your first function to start adding server-side logic.
            </p>
          </div>

          <AddFunctionSheet
            open={open}
            onOpenChange={setOpen}
            projectId={projectId}
            schemas={schemas ?? []}
            hideTrigger={false}
          />
        </div>
      ) : showNoMatchesState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Search size={72} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">No matches</h2>
            <p className="text-muted-foreground text-sm">
              No functions match “{searchTerm.trim()}”.
            </p>
          </div>
          <Button
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {filteredFuncs.map((f: any) => (
            <FunctionCard
              key={`${f.function_name}:${f.arguments ?? ""}`}
              name={f.function_name}
              returnType={mapPostgresType(f.data_type)}
              args={f.arguments}
              schema={schema}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FunctionsPage;

const FunctionCard = ({
  name,
  returnType,
  args,
  schema,
}: {
  name: string;
  returnType: DATA_TYPES;
  args: string;
  schema?: string;
}) => {
  const sig = `${name}(${args || ""})`;

  return (
    <div
      className={cn(
        "group rounded-xl border bg-background p-4",
        "transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-foreground/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FunctionSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-base truncate">{name}</h3>
          </div>

          <p className="text-xs text-muted-foreground mt-1 truncate">
            <span className="font-mono">{returnType}</span>
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
            "text-muted-foreground bg-muted/30",
            "group-hover:text-foreground group-hover:border-foreground/20"
          )}
        >
          RETURNS {returnType}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Signature</p>
        <p className="mt-1 font-mono text-xs text-foreground/90 truncate">
          {sig}
        </p>
      </div>
    </div>
  );
};
