"use client";

import { Separator } from "@/components/ui/separator";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { useEffect, useMemo, useState } from "react";
import SchemaPicker from "../SchemaPicker";
import { Input } from "@/components/ui/input";
import { InboxIcon, Search, BookTypeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AddEnumSheet from "../sheets/AddEnumSheet";

type Props = {
  projectId: string;
  enums: any[];
  schemas: any[]
};

const EnumsPage = ({ projectId, schemas, enums }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

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


  const filteredEnums = useMemo(() => {
    if (!enums) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return enums;

    return enums.filter((f) =>
      f.function_name.toLowerCase().includes(q)
    );
  }, [searchTerm, enums]);

  const showEmptySchemaState = !searchTerm && (enums?.length ?? 0) === 0;
  const showNoMatchesState = !!searchTerm && filteredEnums.length === 0;

  return (
    <div className="fullscreen flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl">Enumerated Types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enums are lists of possible values for a data point.
          </p>
        </div>

        <AddEnumSheet
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
              placeholder="Search enums"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <SchemaPicker schemas={schemas ?? []} value={schema} onChange={setSchema} />
        </div>

        <div className="text-xs text-muted-foreground">
          {`${filteredEnums.length} enums${filteredEnums.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* CONTENT */}
      {showEmptySchemaState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <InboxIcon size={96} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">No enums in “{schema}”</h2>
            <p className="text-muted-foreground text-sm">
              Create your first enum to apply static typing in your databases
            </p>
          </div>

          <AddEnumSheet
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
              No enums match “{searchTerm.trim()}”.
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
          {filteredEnums.map((f: any) => (
            <EnumCard
              key={Math.random()}
              name={f.enum_name}
              values={f.enum_values}
              schema={f.enum_schema}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnumsPage;

const EnumCard = ({
  name,
  values,
  schema
}: {
  name: string;
  values: string;
  schema: string;
}) => {

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
            <BookTypeIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-base truncate">{name}</h3>
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
            "text-muted-foreground bg-muted/30",
            "group-hover:text-foreground group-hover:border-foreground/20"
          )}
        >
          {schema}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Values</p>
        <p className="mt-1 font-mono text-xs text-foreground/90 truncate">
          {values}
        </p>
      </div>
    </div>
  );
};
