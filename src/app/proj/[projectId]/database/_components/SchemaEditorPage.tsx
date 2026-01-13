"use client";

import { useMemo, useEffect, useState } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { ColumnType, JsonNodeData, TableType as SchemaEditorTable } from "@/lib/types";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Node,
  type NodeProps,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import { SquareArrowOutUpRightIcon, Table2Icon, KeyRoundIcon, CircleIcon, PlusIcon, EditIcon, Trash2Icon, FingerprintIcon, EllipsisVerticalIcon, CopyIcon, DownloadIcon, FileJson, FileSpreadsheetIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import '@xyflow/react/dist/style.css';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { gridPosition } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useMutation } from "@tanstack/react-query";
import { deleteColumn } from "@/lib/actions/database/columns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DataViewer from "./DataViewer";
import SchemaPicker from "./SchemaPicker";
import AddTableSheet from "./sheets/AddTableSheet";
import EditColumnSheet from "./sheets/EditColumnSheet";
import EditTableSheet from "./sheets/EditTableSheet";




const SchemaEditorPage = ({
  projectId,
  schemas,
  current_schema
}: {
  projectId: string,
  schemas: string[],
  current_schema: SchemaEditorTable[]
}) => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const table = searchParams.get("table");

  const { schema, setSchema } = useSelectedSchema({
    projectId: projectId,
    schemas: schemas,
    persist: true,
  });

  // Build nodes from props.schema (one node per table)
  const initialNodes = useMemo(() => {
    return current_schema ? current_schema.map((table, i) => {
      const pos = gridPosition(i);

      return {
        id: `${schema}.${table.name}`, // must be unique
        type: "json",
        position: pos,
        dragHandle: '.drag-handle',
        data: {
          title: `${schema}.${table.name}`,
          table, // Pass the table object directly instead of JSON string
        },
      };
    }) : [];
  }, [current_schema, schema]);




  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Keep nodes in sync if props.schema changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);


  const { theme } = useTheme()

  const [isAddTableSheetOpen, setIsAddTableSheetOpen] = useState(false)

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col">
      <ResizablePanelGroup
        direction="vertical"
        className="flex-1 min-h-0 w-full"
      >
        <ResizablePanel defaultSize={100} className="min-h-0">
          <div className="h-full min-h-0 flex flex-col">
            <header className="h-12 shrink-0 flex items-center justify-between border-b-2 p-8">
              <SchemaPicker
                schemas={schemas ?? []}
                value={schema}
                onChange={setSchema}
              />

              <Button
                className="flex items-center gap-2"
                variant={"default"}
                onClick={() => setIsAddTableSheetOpen(true)}
              >
                <PlusIcon className="w-8 h-8"/>
                Add Table
              </Button>

              
            </header>

            {/* THIS must actually have height */}
            <div className="flex-1 min-h-0 max-h-full w-full">
              <ReactFlowProvider>
                <div className="h-full w-full">
                  
                  <ReactFlow
                    defaultViewport={{
                      x: 0,
                      y: 0,
                      zoom: 1
                    }}
                    nodes={nodes}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    style={{ width: "100%", height: "100%" }}
                    colorMode={theme === 'dark' ? "dark" : "light"}
                  >
                    <MiniMap position="top-right"  />
                    <Background variant={BackgroundVariant.Dots} gap={12} />
                  </ReactFlow>
                </div>
              </ReactFlowProvider>
            </div>
          </div>
        </ResizablePanel>
        {schema && table && (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={100} className="min-h-0">
              <div className="h-full min-h-0">
                <DataViewer projectId={projectId} />
              </div>
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>

      <AddTableSheet 
        open={isAddTableSheetOpen}
        onOpenChange={setIsAddTableSheetOpen}
        projectId={projectId}
        schema={schema}
      />
    </div>
  );

};

export default SchemaEditorPage;


function TableColumn({
  projectId,
  schema,
  tableName,
  column
}: {
  projectId: string,
  schema: string,
  tableName: string,
  column: ColumnType
}) {
  const inId = `in:${column.name}`;
  const outId = `out:${column.name}`;

  const { mutate: delCol } = useMutation({
    mutationFn: async (name: string) => {
      await deleteColumn(projectId, schema, tableName, column.name)
    },
    onMutate: () => toast.loading("Deleting Column", { id: "del-col" }),
    onError: (e) => toast.error(`Failed to delete column: ${e}`, { id: "del-col" }),
    onSuccess: () => toast.success("Deleted column", { id: "del-col" })
  })

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="group relative flex items-center justify-between p-2 hover:bg-black/10 hover:dark:bg-black/90">
          <Handle
            type="target"
            id={inId}
            position={Position.Left}
            className="flex! flex-1! min-h-10! w-4! opacity-0!"
            style={{ top: "50%" }}
          />

          <div className="flex items-center gap-2">
            <TooltipProvider>
              {column.isPkey && (
                <Tooltip>
                  <TooltipTrigger>
                    <KeyRoundIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>Primary Key</TooltipContent>
                </Tooltip>
              )}
              {column.isNullable && (
                <Tooltip>
                  <TooltipTrigger>
                    <CircleIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>Nullable</TooltipContent>
                </Tooltip>
              )}
              {column.isUnique && (
                <Tooltip>
                  <TooltipTrigger>
                    <FingerprintIcon className="h-4 w-4" /> {/* Assuming typo; use RecycleCwOffIcon if it exists */}
                  </TooltipTrigger>
                  <TooltipContent>Unique</TooltipContent>
                </Tooltip>
              )}
              {!column.isUnique && !column.isNullable && !column.isPkey && (
                <Tooltip>
                  <TooltipTrigger>
                    <CircleIcon className="h-4 w-4 bg-white rounded-full" /> {/* Assuming typo; use RecycleCwOffIcon if it exists */}
                  </TooltipTrigger>
                  <TooltipContent>Non-nullable</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
            <h2 className={`text-base ${column.isPkey && "font-extrabold"}`}>{column.name}</h2>
          </div>

          <p className="text-muted-foreground text-sm">{column.isArray ? `${column.dtype}[]` : column.dtype}</p>

          <Handle
            type="source"
            id={outId}
            position={Position.Right}
            className="flex! flex-1! min-h-10! w-4! opacity-0!"
            style={{ top: "50%" }}
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="z-500">
          <ContextMenuItem 
            onClick={e => {
              e.stopPropagation()
              setIsEditSheetOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <EditIcon className="w-6 h-6"/>
            Edit Column
          </ContextMenuItem>
          
          <ContextMenuSeparator />

          <ContextMenuItem 
            onClick={e => {
              e.stopPropagation()
              delCol(column.name)
            }}
            className="flex items-center gap-2"
          >
            <Trash2Icon className="w-6 h-6"/>
            Delete Column
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <EditColumnSheet 
        onOpenChange={setIsEditSheetOpen}
        open={isEditSheetOpen}
        projectId={projectId}
        schema={schema}
        column={column}
        table={tableName}
      />
    </>
  )
}

function TableNode({ data }: NodeProps<Node<JsonNodeData>>) {
  const [schema, tableName] = data.title.split(".");

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const projectId = pathname.split("/")[2]

  const [editTableSheetOpen, setEditTableSheetOpen] = useState(false)



  return (
    <>
      <TooltipProvider>
        <div className="w-[480px] rounded-xl border bg-background shadow-sm drag-handle"> {/* Increased width for better table fit */}
          <div className="rounded-t-xl border-b px-3 py-2 flex items-center justify-between gap-2 font-semibold text-base dark:bg-white/10 bg-black/10">
            <div className="flex fullwidth justify-between items-center">
              <div className="flex items-center gap-2">
                <Table2Icon className="h-4 w-4" />
                {tableName}
              </div>

              <div className="flex items-center gap-2 px-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="nodrag nopan cursor-pointer" // ✅ key for React Flow
                      onPointerDown={(e) => e.stopPropagation()} // ✅ prevents drag start
                      onClick={(e) => {
                        e.stopPropagation();

                        const sp = new URLSearchParams(searchParams.toString());
                        sp.set("schema", schema);
                        sp.set("table", tableName);

                        router.push(`${pathname}?${sp.toString()}`);
                      }}
                    >
                      <SquareArrowOutUpRightIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent>See Data</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer">
                    <EllipsisVerticalIcon className="w-4 h-4"/>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      
                      className="flex items-center gap-2"
                    >
                      <CopyIcon className="w-6 h-6"/>
                      Copy Name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                    >
                      <CopyIcon className="w-6 h-6"/>
                      Copy Schema
                    </DropdownMenuItem>

                    <ContextMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setEditTableSheetOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <EditIcon className="w-6 h-6"/>
                      Edit Table
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="flex items-center gap-2"
                    >
                      <CopyIcon className="w-6 h-6"/>
                      Duplicate Table
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        className="flex items-center gap-2"
                      >
                        <DownloadIcon className="w-6 h-6" />
                        Downlaod
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <FileJson className="w-6 h-6" />
                          JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <FileSpreadsheetIcon className="w-6 h-6" />
                          CSV
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <ContextMenuSeparator />

                    <DropdownMenuItem
                      className="flex items-center gap-2"
                    >
                      <Trash2Icon className="w-6 h-6"/>
                      Delete Table
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </div> 
            </div>
          </div>

          <div className="flex flex-col divide-y divide-gray-600 cursor-default">
            {data.table.columns.map((col, idx) => (
              <TableColumn
                projectId={projectId}
                schema={schema}
                tableName={data.table.name}
                key={idx} 
                column={col}
              />
            ))}
          </div>
          
        </div>
      </TooltipProvider>
      
      <EditTableSheet 
        onOpenChange={setEditTableSheetOpen}
        open={editTableSheetOpen}
        projectId={projectId}
        schema={schema}
        table={data.table}
      />
    </>
  );
}

const nodeTypes = { json: TableNode };