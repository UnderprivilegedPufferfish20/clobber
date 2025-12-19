"use client";

import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SchemaPicker from "../SchemaPicker";
import { useQuery } from "@tanstack/react-query";
import { getSchemas, getTables } from "@/lib/actions/database/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, Table2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { cn } from "@/lib/utils";
import AddTableDialog from "../dialogs/AddTableDialog";

const TableEditorSidebar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedTable = searchParams.get("table");
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
      setSchema(schemas[0]);
    }
  }, [schemas, schema, setSchema]);

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

  const handleTableClick = (tableName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("table", tableName);
    if (schema) {
      params.set("schema", schema);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

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
    <aside className="sidebar">
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
              <div className="fullwidth">
                {tables.map((t) => (
                  <div
                    key={t}
                    onClick={() => handleTableClick(t)}
                    className={cn(
                      "fullwidth px-3 py-2 flex items-center hover:bg-white/10 hover:cursor-pointer transition-colors",
                      selectedTable === t ? "bg-indigo-600/20 border-l-4 border-indigo-500" : ""
                    )}
                  >
                    <Table2Icon className="w-4 h-4" />
                    <h2 className="font-semibold text-md ml-4">{t}</h2>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default TableEditorSidebar;