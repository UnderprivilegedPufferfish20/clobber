"use client";

import { Separator } from "@/components/ui/separator";
import { usePathname, useSearchParams } from "next/navigation";
import SchemaPicker from "./SchemaPicker";
import { useQuery } from "@tanstack/react-query";
import { getSchemas, getTables } from "@/lib/actions/database/actions";
import { Skeleton } from "@/components/ui/skeleton";
import AddTableDialog from "./AddTableDialog";
import { SlidersHorizontal, Table2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";

const DatabaseSidebar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();



  const page = searchParams.get("page") ?? "table_editor";
  const projectId = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);

  // 1) Schemas
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

  const { schema, setSchema, isReady } = useSelectedSchema({
    projectId,
    schemas,
    persist: true,
  });

  useEffect(() => {
    if (!schema && schemas && schemas.length > 0) {
      setSchema(schemas[0]); // default to first schema once it arrives
    }
  }, [schemas, schema]);

  // 3) Tables (only fetch when schema is ready)
  const {
    data: tables,
    isLoading: tablesLoading,
    isError: tablesError,
    error: tablesErrObj
  } = useQuery({
    queryKey: ["tables", projectId, schema],
    queryFn: () => getTables(projectId, schema as string),
    enabled: !!projectId && !!schema,
  });

  // ---- Render states
  if (schemasError) {
    return (
      <aside className="fullheight w-74 min-w-74 max-w-74 flex flex-col items-center border-r-2">
        <div className="p-4 text-sm">
          Failed to load schemas: {(schemasErrObj as Error)?.message ?? "Unknown error"}
        </div>
      </aside>
    );
  }



  return (
    <aside className="fullheight w-74 min-w-74 max-w-74 flex flex-col items-center border-r-2">
      {page === "table_editor" && (
        <div className="fullwidth flex flex-col">
          <h1 className="text-2xl font-semibold m-4">Table Editor</h1>
          <Separator className="pt-0!" />

          {schemasLoading || !isReady ? (
            <div className="flex flex-col p-2">
              <div className="flex items-center gap-2 mb-2 justify-evenly">
                <Skeleton className="h-8 w-32 bg-gray-700" />
                <Skeleton className="h-8 w-12 bg-gray-700" />
                <Skeleton className="h-8 w-12 bg-gray-700" />
              </div>
              <Skeleton className="h-8 fullwidth bg-gray-700" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-evenly fullwidth mt-6 mb-2">
                <SchemaPicker
                  schemas={schemas ?? []}
                  value={schema}
                  onChange={setSchema}
                />
                <AddTableDialog projectId={projectId} schema={schema ?? "public"} />
                <SlidersHorizontal />
              </div>

              {tablesError ? (
                <div className="p-4 text-sm">
                  Failed to load tables: {(tablesErrObj as Error)?.message ?? "Unknown error"}
                </div>
              ) : tablesLoading || !tables ? (
                <div className="fullwidth p-2">
                  <Skeleton className="h-6 fullwidth bg-gray-700 mb-2" />
                  <Skeleton className="h-6 fullwidth bg-gray-700 mb-2" />
                  <Skeleton className="h-6 fullwidth bg-gray-700" />
                </div>
              ) : (
                tables.map((t) => (
                  <div key={t} className="fullwidth bg-gray-900 px-3 py-2 flex items-center hover:bg-gray-800 hover:cursor-pointer">
                    <Table2Icon />
                    <h2 className="font-semibold text-xl ml-4">{t}</h2>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default DatabaseSidebar;
