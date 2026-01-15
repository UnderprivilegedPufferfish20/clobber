"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { InboxIcon, Search } from "lucide-react";
import { ComponentType, ReactNode, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { DatabaseObjectAddSheetProps } from "@/lib/types";
import SchemaPicker from "@/app/proj/[projectId]/database/_components/SchemaPicker";

export default function CardPage<DataType>({
  projectId,
  schemas,
  data,
  title,
  description,

  DisplayCard,
  AddSheet,
  schemafilter = true
}: {
  projectId: string,
  schemas: string[],
  data: DataType[],
  title: string,
  description: string,

  DisplayCard: ComponentType<DataType>,
  AddSheet: ComponentType<DatabaseObjectAddSheetProps>,

  schemafilter?: boolean
}) {
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

  const filteredData = useMemo(() => {
    if (!data) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;

    return data.filter((i: any) =>
      i.function_name.toLowerCase().includes(q)
    );
  }, [searchTerm, data]);

  const showEmptySchemaState = schemafilter ? !searchTerm && (data?.length ?? 0) === 0 : false;
  const showNoMatchesState = !!searchTerm && filteredData.length === 0;

  return (
    <>
    
      <div className="fullscreen flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          </div>

          <Button
            onClick={() => setOpen(true)}
            variant={"default"}
          >
            Create {title}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 mb-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-72"
                placeholder={`Search ${title}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {schemafilter && <SchemaPicker schemas={schemas ?? []} value={schema} onChange={setSchema} />}
          </div>

          <div className="text-xs text-muted-foreground">
            {filteredData.length} {title}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* CONTENT */}
        {showEmptySchemaState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <InboxIcon size={96} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">No {title} in “{schema}”</h2>
              <p className="text-muted-foreground text-sm">
                Create {title.slice(0,-1)}
              </p>
            </div>

            <Button
              onClick={() => setOpen(true)}
              variant={"default"}
            >
              Create {title}
            </Button>
          </div>
        ) : showNoMatchesState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Search size={72} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">No matches</h2>
              <p className="text-muted-foreground text-sm">
                No {title} match “{searchTerm.trim()}”.
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
            <div className="fullscreen">
              {!schemafilter && filteredData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                  <InboxIcon size={96} className="text-muted-foreground" />
                  
                    <h2 className="text-2xl font-semibold">No {title}</h2>
                    
             

                  <Button
                    onClick={() => setOpen(true)}
                    variant={"default"}
                  >
                    Create {title}
                  </Button>
                </div>
              ) : (
                <>
                  {filteredData.map((i: DataType) => {
                    return (
                    <DisplayCard
                      key={Math.random()}
                      {...i}
                    />
                  )})}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AddSheet
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        schemas={schemas ?? []}
      />
    </>
  );
}