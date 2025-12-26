"use client";

import { useMemo, useEffect, useState } from "react";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import SchemaPicker from "../SchemaPicker";
import { DATA_TYPES, SchemaEditorTable } from "@/lib/types";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { SquareArrowOutUpRightIcon, Table2Icon, KeyRoundIcon, CircleIcon, RefreshCwOffIcon, GripVerticalIcon, PlusIcon } from "lucide-react"; // Assuming "RecycleCwOffIcon" is a typo for "RefreshCwOffIcon"; adjust if needed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import '@xyflow/react/dist/style.css';
import AddColumnSheet from "../sheets/AddColumnSheet";
import { t } from "@/lib/utils";

// ---------------------------
// 1) Custom node that shows columns in a table UI
// ---------------------------
type JsonNodeData = {
  title: string;
  table: SchemaEditorTable;
};

function TableColumn({
  isNullable,
  isUnique,
  isPrimaryKey,
  name,
  datatype,

}: {
  isNullable:boolean,
  isUnique:boolean,
  isPrimaryKey:boolean,
  name: string,
  datatype: DATA_TYPES
}) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-black/10 hover:dark:bg-black/90">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {isPrimaryKey && (
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
          {!isUnique && !isNullable && !isPrimaryKey && (
            <Tooltip>
              <TooltipTrigger>
                <CircleIcon className="h-4 w-4 bg-white rounded-full" /> {/* Assuming typo; use RecycleCwOffIcon if it exists */}
              </TooltipTrigger>
              <TooltipContent>Non-nullable</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
        <h2 className={`text-base ${isPrimaryKey && "font-extrabold"}`}>{name}</h2>
      </div>

      <p className="text-muted-foreground text-sm">{datatype}</p>
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

  return (
    <TooltipProvider>
      <div className="w-[480px] rounded-xl border bg-background shadow-sm drag-handle"> {/* Increased width for better table fit */}
        <div className="rounded-t-xl border-b px-3 py-2 flex items-center justify-between gap-2 font-semibold text-base dark:bg-white/10 bg-black/10">
          <div className="flex items-center gap-2 ">
            <Table2Icon className="h-4 w-4" />
            {tableName}
          </div>

          <div className="flex items-center gap-0">

            <Tooltip>
              <AddColumnSheet
                hideTrigger
                trigger={
                <TooltipTrigger asChild>
                <Button
                type="button"
                variant="ghost"
                className="nodrag nopan"
                onPointerDown={(e) => e.stopPropagation()}
              >
              <PlusIcon className="w-4 h-4" />
              </Button>
              </TooltipTrigger>
              }
              open={addColumnSheetOpen}
              onOpenChange={setAddColumnSheetOpen}
              projectId={projectId}
              schema={schema}
              tableId={tableName}
              />
              <TooltipContent>Add Column</TooltipContent>
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
                    sp.set("page", "table_editor");
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
            <TableColumn
              key={idx} 
              datatype={col.datatype}
              isNullable={col.isNullable}
              isPrimaryKey={col.isPrimaryKey}
              isUnique={col.isUnique}
              name={col.name}
            />
          ))}
        </div>

        {/* Custom Legend */}
        
      </div>
    </TooltipProvider>
  );
}

const nodeTypes = { json: TableNode };

function gridPosition(i: number) {
  const colW = 520; // Increased for wider nodes
  const rowH = 420; // Adjusted for potential height
  const cols = 3; // tweak to taste
  return {
    x: (i % cols) * colW,
    y: Math.floor(i / cols) * rowH,
  };
}

type Props = {
  projectId: string;
  schemas: string[];
  schema: SchemaEditorTable[]; // this is your array of tables
};

const SchemaEditorPage = (props: Props) => {
  const { schema, setSchema } = useSelectedSchema({
    projectId: props.projectId,
    schemas: props.schemas,
    persist: true,
  });

  // Build nodes from props.schema (one node per table)
  const initialNodes = useMemo(() => {
    return props.schema ? props.schema.map((table, i) => {
      const pos = gridPosition(i);

      return {
        id: `${table.schema}.${table.name}`, // must be unique
        type: "json",
        position: pos,
        dragHandle: '.drag-handle',
        data: {
          title: `${table.schema}.${table.name}`,
          table, // Pass the table object directly instead of JSON string
        },
      };
    }) : [];
  }, [props.schema]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const {theme} = useTheme()

  // Keep nodes in sync if props.schema changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  return (
    <div className="fullscreen flex flex-col">
      <header className="h-12 shrink-0 flex items-center justify-between border-b-2 p-4">
        <SchemaPicker
          schemas={props.schemas ?? []}
          value={schema}
          onChange={setSchema}
        />
      </header>

      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <ReactFlow
            colorMode={theme === "dark" ? "dark" : "light"}
            className="fullscreen"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          >
            <Background variant={BackgroundVariant.Dots} gap={12} />
            <MiniMap />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div className="border-t px-3 py-2 text-sm flex items-center justify-center gap-4 h-12 min-h-12 max-h-12">
        <div className="flex items-center gap-1">
          <KeyRoundIcon className="h-4 w-4" /> Primary Key
        </div>
        <div className="flex items-center gap-1">
          <CircleIcon className="h-4 w-4" /> Nullable
        </div>
        <div className="flex items-center gap-1">
          <RefreshCwOffIcon className="h-4 w-4" /> Unique {/* Adjust icon if needed */}
        </div>
      </div>
    </div>
  );
};

export default SchemaEditorPage;