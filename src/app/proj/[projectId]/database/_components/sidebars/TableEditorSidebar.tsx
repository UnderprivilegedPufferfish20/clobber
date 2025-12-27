"use client";

import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SchemaPicker from "../SchemaPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyIcon, DownloadIcon, EllipsisVerticalIcon, FileJsonIcon, FileSpreadsheetIcon, SlidersHorizontal, Table2Icon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { cn } from "@/lib/utils";
import AddTableDialog from "../dialogs/AddTableDialog";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { toast } from "sonner";
import { getTableSchema } from "@/lib/actions/database/getActions";
import { deleteTable } from "@/lib/actions/database/deleteActions";
import DeleteDialog from "../dialogs/DeleteDialog";

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
                  <SidebarTable 
                    handleTableClick={handleTableClick}
                    name={t}
                    projectId={projectId}
                    schema={schema}
                    selectedTable={selectedTable}
                    key={t}
                  />
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

function SidebarTable({
  handleTableClick,
  name,
  selectedTable,
  projectId,
  schema
}: {
  handleTableClick: any,
  name: string,
  selectedTable: string | null,
  projectId: string,
  schema: string
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            key={name}
            onClick={() => handleTableClick(name)}
            className={cn(
              "group fullwidth px-3 py-1 flex items-center justify-between hover:bg-white/10 hover:cursor-pointer transition-colors",
              selectedTable === name ? 
                  'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                  : 'text-black hover:bg-white/5! dark:text-white dark:hover:text-white!'
            )}
          >
            <div className="flex items-center">
              <Table2Icon className="w-4 h-4" />
              <h2 className="font-semibold text-md ml-4">{name}</h2>
            </div>

            <SidebarTableDropdown
              // keep your existing hover behavior, but allow forcing visibility when open
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              name={name}
              projectId={projectId}
              schema={schema}
            />

          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem 
            className="flex gap-2 items-center"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(name)
                toast.success("Table name copied!", { id: "copy-clipboard" })
              } catch (error) {
                toast.error(`Failed to copy table name: ${error}`, { id: "copy-clipboard" })
              }
              
            }}
          >
            <CopyIcon className="h-4 w-4"/>
            Copy Name
          </ContextMenuItem>
          <ContextMenuItem 
            className="flex gap-2 items-center"
            onClick={async () => {
              try {
                const result = await getTableSchema(projectId, schema, name)
                await navigator.clipboard.writeText(result)
                toast.success("Table schema copied!", { id: "copy-clipboard" })
              } catch (error) {
                toast.error(`Failed to copy table schema: ${error}`, { id: "copy-clipboard" })
              }
              
            }}
          >
            <CopyIcon className="h-4 w-4"/>
            Copy Schema
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex gap-2 items-center">
              <DownloadIcon className="h-4 w-4"/>
              Export
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-44">
              <ContextMenuItem className="flex gap-2 items-center">
                <FileSpreadsheetIcon className="h-4 w-4" />
                CSV
              </ContextMenuItem>
              <ContextMenuItem className="flex gap-2 items-center">
                <FileJsonIcon className="h-4 w-4" />
                JSON
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onSelect={() => setDeleteDialogOpen(true)} 
            className="flex gap-2 items-center"
          >
            <Trash2Icon className="h-4 w-4" />
            Delete Table
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <DeleteDialog
        hideTrigger
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen} 
        deleteFunction={deleteTable}
        name={name}
        projectId={projectId}
        schema={schema}
        toBeDeleted="Table"
      />
    </>
  )
}

function SidebarTableDropdown({
  className,
  name,
  projectId,
  schema,
}: {
  className: string;
  name: string;
  projectId: string;
  schema: string;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault?.();
    e.stopPropagation();
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            // ✅ stop the row click from ever firing
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            // ✅ force visible when open (even if hover is lost)
            className={cn(className, open && "opacity-100")}
          >
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-48"
          align="start"
          // ✅ clicks inside menu should never select the row
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="flex gap-2 items-center"
            // Radix: prefer onSelect for menu items
            onSelect={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await navigator.clipboard.writeText(name);
                toast.success("Table name copied!", { id: "copy-clipboard" });
              } catch (error) {
                toast.error(`Failed to copy table name: ${error}`, {
                  id: "copy-clipboard",
                });
              }
            }}
          >
            <CopyIcon className="h-4 w-4" />
            Copy Name
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex gap-2 items-center"
            onSelect={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const result = await getTableSchema(projectId, schema, name);
                await navigator.clipboard.writeText(result);
                toast.success("Table schema copied!", { id: "copy-clipboard" });
              } catch (error) {
                toast.error(`Failed to copy table schema: ${error}`, {
                  id: "copy-clipboard",
                });
              }
            }}
          >
            <CopyIcon className="h-4 w-4" />
            Copy Schema
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="flex items-center gap-2"
              // ✅ prevent row selection when opening submenus
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // export csv...
                  }}
                >
                  <FileSpreadsheetIcon className="w-4 h-4" />
                  CSV
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // export json...
                  }}
                >
                  <FileJsonIcon className="w-4 h-4" />
                  JSON
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteDialogOpen(true);
              // optional: close menu when opening dialog
              setOpen(false);
            }}
          >
            <Trash2Icon className="h-4 w-4" />
            Delete Table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        hideTrigger
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteFunction={deleteTable}
        name={name}
        projectId={projectId}
        schema={schema}
        toBeDeleted="Table"
      />
    </>
  );
}
