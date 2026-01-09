"use client";

import { useMemo, useEffect, useState } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import SchemaPicker from "../SchemaPicker";
import { ColumnType, JsonNodeData, TableType as SchemaEditorTable } from "@/lib/types";
import { DATA_TYPES_LIST } from "@/lib/constants";
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
import { SquareArrowOutUpRightIcon, Table2Icon, KeyRoundIcon, CircleIcon, RefreshCwOffIcon, GripVerticalIcon, PlusIcon, Edit2Icon, EditIcon, Trash2Icon } from "lucide-react"; // Assuming "RecycleCwOffIcon" is a typo for "RefreshCwOffIcon"; adjust if needed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import '@xyflow/react/dist/style.css';
import AddColumnSheet from "../sheets/AddColumnSheet";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import TableView from "../TableView";
import { gridPosition } from "@/lib/utils";
import EditTableSheet from "../sheets/EditTableSheet";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useMutation } from "@tanstack/react-query";
import { deleteColumn } from "@/lib/actions/database/columns";
import { toast } from "sonner";




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

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col">
      <ResizablePanelGroup
        direction="vertical"
        className="flex-1 min-h-0 w-full"
      >
        <ResizablePanel defaultSize={100} className="min-h-0">
          <div className="h-full min-h-0 flex flex-col">
            <header className="h-12 shrink-0 flex items-center justify-between border-b-2 p-4">
              <SchemaPicker
                schemas={schemas ?? []}
                value={schema}
                onChange={setSchema}
              />
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
                <TableView projectId={projectId} />
              </div>
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>
    </div>
  );

};

export default SchemaEditorPage;


function TableColumn({
  isNullable,
  isUnique,
  isPkey,
  name,
  dtype,
  isArray,

}: {
  isNullable:boolean,
  isUnique:boolean,
  isPkey:boolean,
  name: string,
  dtype: (typeof DATA_TYPES_LIST)[number],
  isArray: boolean
}) {
  const inId = `in:${name}`;
  const outId = `out:${name}`;

  return (
    <div className="group relative flex items-center justify-between p-2 hover:bg-black/10 hover:dark:bg-black/90">
      <Handle
        type="target"
        id={inId}
        position={Position.Left}
        className="w-2.5! h-2.5! bg-muted-foreground!"
        style={{ top: "50%" }}
      />

      <div className="flex items-center gap-2">
        <TooltipProvider>
          {isPkey && (
            <Tooltip>
              <TooltipTrigger>
                <KeyRoundIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Primary Key</TooltipContent>
            </Tooltip>
          )}
          {isNullable && (
            <Tooltip>
              <TooltipTrigger>
                <CircleIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Nullable</TooltipContent>
            </Tooltip>
          )}
          {isUnique && (
            <Tooltip>
              <TooltipTrigger>
                <RefreshCwOffIcon className="h-4 w-4" /> {/* Assuming typo; use RecycleCwOffIcon if it exists */}
              </TooltipTrigger>
              <TooltipContent>Unique</TooltipContent>
            </Tooltip>
          )}
          {!isUnique && !isNullable && !isPkey && (
            <Tooltip>
              <TooltipTrigger>
                <CircleIcon className="h-4 w-4 bg-white rounded-full" /> {/* Assuming typo; use RecycleCwOffIcon if it exists */}
              </TooltipTrigger>
              <TooltipContent>Non-nullable</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
        <h2 className={`text-base ${isPkey && "font-extrabold"}`}>{name}</h2>
      </div>

      <p className="text-muted-foreground text-sm">{isArray ? `${dtype}[]` : dtype}</p>

      <Handle
        type="source"
        id={outId}
        position={Position.Right}
        className="w-2.5! h-2.5! bg-muted-foreground!"
        style={{ top: "50%" }}
      />
    </div>
  )
}

function TableNode({ data }: NodeProps<Node<JsonNodeData>>) {
  const [schema, tableName] = data.title.split(".");

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const projectId = pathname.split("/")[2]

  const [addColumnSheetOpen, setAddColumnSheetOpen] = useState(false)
  const [editSheetOpen, setIsEditSheetOpen] = useState(false)
  const [editingCol, setEditingCol] = useState<ColumnType>()
  const [editingColOpen, setEditingColOpen] = useState(false)

  const { mutate: delCol } = useMutation({
    mutationFn: async (name: string) => {
      await deleteColumn(projectId, schema, tableName, name)
    },
    onMutate: () => toast.loading("Deleting Column", { id: "del-col" }),
    onError: (e) => toast.error(`Failed to delete column: ${e}`, { id: "del-col" }),
    onSuccess: () => toast.success("Deleted column", { id: "del-col" })
  })

  useEffect(() => {
    if (!editingCol) return;
    setEditingColOpen(true)
  }, [editingCol])

  useEffect(() => {
    if (editingColOpen === true) return;
    setEditingCol(undefined)
  }, [editingColOpen])

  return (
    <>
      <TooltipProvider>
        <div className="w-[480px] rounded-xl border bg-background shadow-sm drag-handle"> {/* Increased width for better table fit */}
          <div className="rounded-t-xl border-b px-3 py-2 flex items-center justify-between gap-2 font-semibold text-base dark:bg-white/10 bg-black/10">
            <div className="flex items-center gap-2 ">
              <Table2Icon className="h-4 w-4" />
              {tableName}
            </div>

            <div className="flex items-center gap-0">

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="nodrag nopan"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      setAddColumnSheetOpen(true)
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
  
                <TooltipContent>Add Column</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"ghost"}
                    onClick={e => {
                      e.stopPropagation()
                      setIsEditSheetOpen(true)
                    }}
                  >
                    <Edit2Icon className="w-4 h-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Edit Table
                </TooltipContent>
              </Tooltip>

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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={'ghost'}
                    className="cursor-grab"
                  >
                    <GripVerticalIcon className="h-4 w-4 drag-handle cursor-grabbing" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Drag</TooltipContent>
              </Tooltip>
              
            </div>
          </div>

          <div className="flex flex-col divide-y divide-gray-600 cursor-default">
            {data.table.columns.map((col, idx) => (
              <ContextMenu>
                <ContextMenuTrigger>
                  <TableColumn
                    key={idx} 
                    dtype={col.dtype}
                    isArray={col.isArray}
                    isNullable={col.isNullable}
                    isPkey={col.isPkey}
                    isUnique={col.isUnique}
                    name={col.name}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={e => {
                      e.stopPropagation()
                      setEditingCol(col)
                    }}
                    className="flex items-center gap-2"
                  >
                    <EditIcon className="w-4 h-4" />
                    Edit Column
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    onClick={e => {
                      e.stopPropagation()
                      delCol(col.name)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2Icon className="w-4 h-4" />
                    Delete Column
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>

          {/* Custom Legend */}
          
        </div>
      </TooltipProvider>
      
      <AddColumnSheet
        open={addColumnSheetOpen}
        onOpenChange={setAddColumnSheetOpen}
        projectId={projectId}
        schema={schema}
        tableId={tableName}
      />

      <EditTableSheet 
        onOpenChange={setIsEditSheetOpen}
        open={editSheetOpen}
        projectId={projectId}
        schema={schema}
        tableToBeEdited={data.table.name}
      />
          
    </>
  );
}

const nodeTypes = { json: TableNode };