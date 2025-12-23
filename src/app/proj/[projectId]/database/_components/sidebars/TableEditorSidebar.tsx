"use client";

import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SchemaPicker from "../SchemaPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, Table2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { cn } from "@/lib/utils";
import AddTableDialog from "../dialogs/AddTableDialog";

const TableEditorSidebar = ({
  schemas,
  tables
}: {
  schemas: string[],
  tables: string[]
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedTable = searchParams.get("table");
  const projectId = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);


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


  const handleTableClick = (tableName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("table", tableName);
    if (schema) {
      params.set("schema", schema);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside className="sidebar">
      <div className="fullwidth flex flex-col">
        <h1 className="text-2xl font-semibold m-4">Table Editor</h1>
        <Separator className="pt-0!" />

        {!isReady ? (
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

            {!tables ? (
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