"use client";

import { Separator } from "@/components/ui/separator";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import SchemaPicker from "../SchemaPicker";
import { Input } from "@/components/ui/input";
import { InboxIcon, Search, ListTreeIcon, EllipsisVerticalIcon } from "lucide-react";
import { INDEX_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AddIndexSheet from "../sheets/AddIndexSheet";
import { deleteIndex } from "@/lib/actions/database/deleteActions";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../dialogs/DeleteDialog";

type Props = {
  projectId: string;
  schemas: string[];
  indexes: any[]
};

const IndexesPage = ({ projectId, schemas, indexes }: Props) => {
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


  const filteredIndexes = useMemo(() => {
    if (!indexes) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return indexes;

    return indexes.filter((i: any) =>
      i.function_name.toLowerCase().includes(q)
    );
  }, [searchTerm, indexes]);

  const showEmptySchemaState = !searchTerm && (indexes?.length ?? 0) === 0;
  const showNoMatchesState = !!searchTerm && filteredIndexes.length === 0;

  return (
    <div className="fullscreen flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl">Indexes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Indexes are organized lists on columns that help the computer quickly find exactly where information is stored, so it doesn't have to look through everything every single time. 
          </p>
        </div>

        <AddIndexSheet
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
              placeholder="Search indexes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <SchemaPicker schemas={schemas ?? []} value={schema} onChange={setSchema} />
        </div>

        <div className="text-xs text-muted-foreground">
          {`${filteredIndexes.length} indexes${filteredIndexes.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* CONTENT */}
      {showEmptySchemaState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <InboxIcon size={96} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">No indexes in “{schema}”</h2>
            <p className="text-muted-foreground text-sm">
              Create your first index to speed up searching.
            </p>
          </div>

          <AddIndexSheet
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
              No indexes match “{searchTerm.trim()}”.
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
          {filteredIndexes.map((i: any) => (
            <IndexCard
              key={i.index_name}
              definition={i.index_definition}
              method={i.access_method as INDEX_TYPES}
              name={i.index_name}
              schema={i.schema_name}
              table={i.table_name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IndexesPage;

const IndexCard = ({
  name,
  table,
  method,
  schema,
  definition
}: {
  name: string;
  table: string;
  method: INDEX_TYPES;
  definition: string;
  schema: string
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const pathname = usePathname();

  const projectId = pathname.split("/")[2]

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
            <ListTreeIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-base truncate">{name}</h3>
          </div>


          
          <p className="text-xs text-muted-foreground mt-1 truncate">
            <span className="text-muted-foreground">{schema}.<span className="text-black dark:text-white">{table}</span></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
              "text-muted-foreground bg-muted/30",
              "group-hover:text-foreground group-hover:border-foreground/20"
            )}
          >
            {method.toString()}
          </span>

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"}><EllipsisVerticalIcon /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={e => {
                e.preventDefault()
              }}>
                <DeleteDialog
                  toBeDeleted="Index"
                  deleteFunction={deleteIndex} 
                  name={name}
                  projectId={projectId}
                  schema={schema}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>

      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Preview</p>
        <p className="mt-1 font-mono text-xs text-foreground/90 truncate">
          {definition}
        </p>
      </div>
    </div>
  );
};
