"use client";

import type * as monacoType from "monaco-editor";
import React, { useEffect, useRef, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../DeleteDialog";
import { Input } from "@/components/ui/input";
import { FunctionSquare, EllipsisVerticalIcon, PencilIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Editor } from "@monaco-editor/react";
import { toast } from "sonner";
import { Popover } from "@/components/ui/popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { changeFunctionSchema, renameFunction, createFunction, deleteFunction } from "@/lib/actions/database/functions";
import { DATA_TYPES, DatabaseFunctionType } from "@/lib/types";

const FunctionCard = ({
  schema_name,
  function_name,
  function_type,
  data_type,
  arguments: args,
  definition
}: DatabaseFunctionType) => {
  let sig = `${function_name}(${args || ""})`;
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];


  

  const extractBody = (def: string) => {
    const defUpper = def.toUpperCase();
    const beginIdx = defUpper.indexOf("BEGIN");
    if (beginIdx === -1) return def.trim();
    const endIdx = defUpper.lastIndexOf("END");
    if (endIdx === -1) return def.substring(beginIdx + 5).trim();
    return def.substring(beginIdx + 5, endIdx).trim();
  };

  const [initialBody, setInitialBody] = useState(() => extractBody(definition));
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(function_name)
  const [funcBody, setFuncBody] = useState(initialBody);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  const hasChanges = funcBody !== initialBody;

  const handleUndo = () => setFuncBody(initialBody);

  const handleSave = async (props: { newSchema?: string, newName?: string, newBody?: string } ) => {
    console.log("handleSave called");
    if (Object.keys(props).length !== 1) throw new Error("Can only change one thing about func at a time")
    try {
      if (props.newSchema) {
        await changeFunctionSchema(projectId, schema_name, sig, props.newSchema)
      } else if (props.newName) {
        await renameFunction(projectId, schema_name, sig, editedName)
      } else {
        await createFunction({
          name: function_name,
          schema: "puclic",
          args: sig
            .split("(")[1]
            .split(")")[0]
            .split(", ")
            .filter(Boolean)
            .map((o) => ({
              name: o.split(" ")[0],
              dtype: o.split(" ")[1] as typeof DATA_TYPES[keyof typeof DATA_TYPES],
            })),
          definition: funcBody,
          returnType: function_type
        }, projectId)
      }


      toast.success("Function updated sucessfully", { id: "update-function" })
    } catch (error) {
      toast.error(
        `Failed to update ${name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: `update-function` }
      )
    }
  };

  // ---------- Monaco auto-height ----------
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoType | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!nameInputRef.current) return;

    nameInputRef.current.focus()
  }, [isEditingName])

  // tweak these to taste
  const MIN_EDITOR_HEIGHT = 140; // initial size
  const MAX_EDITOR_HEIGHT = 900; // safety cap

  const [editorHeight, setEditorHeight] = useState<number>(MIN_EDITOR_HEIGHT);

  const clamp = (n: number) => Math.max(MIN_EDITOR_HEIGHT, Math.min(MAX_EDITOR_HEIGHT, n));

  const recalcHeight = () => {
    const ed = editorRef.current;
    if (!ed) return;

    // Monaco reports the content height (in px) based on line count + wrapping
    const contentHeight = ed.getContentHeight();

    // add a tiny buffer so last line isn't tight
    const next = clamp(Math.ceil(contentHeight) + 8);

    setEditorHeight((prev) => (prev === next ? prev : next));
    ed.layout({ width: ed.getLayoutInfo().width, height: next });
  };

  const handleMount = (
    editor: monacoType.editor.IStandaloneCodeEditor,
    monaco: typeof monacoType
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // initial calc once layout is ready
    requestAnimationFrame(recalcHeight);

    // when content changes (incl. wrapping changes), recalc
    const model = editor.getModel();
    const disposers: Array<{ dispose: () => void }> = [];

    if (model) {
      disposers.push(
        model.onDidChangeContent(() => {
          // let Monaco update wrapping/layout first
          requestAnimationFrame(recalcHeight);
        })
      );
    }

    disposers.push(
      editor.onDidContentSizeChange(() => {
        // fires on wrapping/line-height changes too
        requestAnimationFrame(recalcHeight);
      })
    );

    // also handle window resize
    const onResize = () => requestAnimationFrame(recalcHeight);
    window.addEventListener("resize", onResize);

    // cleanup
    (editor as any).__autoHeightCleanup = () => {
      window.removeEventListener("resize", onResize);
      disposers.forEach((d) => d.dispose());
    };
  };

  useEffect(() => {
    return () => {
      const ed = editorRef.current as any;
      if (ed?.__autoHeightCleanup) ed.__autoHeightCleanup();
    };
  }, []);


  // if definition changes externally, keep height correct
  useEffect(() => {
    requestAnimationFrame(recalcHeight);
  }, [funcBody]);
  // ---------------------------------------


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
          <div className="group flex items-center gap-2">
            <FunctionSquare className="h-6 w-6 text-muted-foreground" />
            {isEditingName ? (
              <Input
                ref={nameInputRef} 
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                onBlur={() => {
                  setIsEditingName(p => !p)
                  setEditedName(function_name)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave({ newName: editedName })
                }}
              />
            ) : (
              <h3 
                className="font-semibold text-2xl truncate"
              >
                {function_name}
              </h3>
            )}
            <Button
              onClick={() => setIsEditingName(p => !p)}
              variant={'ghost'}
              className={`text-muted-foreground opacity-0 ${!isEditingName && "group-hover:opacity-100"} transition-opacity duration-200 cursor-pointer`}
            >
              <PencilIcon />
            </Button>
          </div>

          

          <div className="group flex items-center gap-2">
            
              <p className="text-lg text-muted-foreground mt-1 truncate">
                <span className="font-mono">"puclic"</span>
              </p>
          
          </div>

        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
              "text-muted-foreground bg-muted/30",
              "group-hover:text-foreground group-hover:border-foreground/20"
            )}
          >
            RETURNS {function_type}
          </span>

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"}>
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <DeleteDialog
                  toBeDeleted="Function"
                  deleteFunction={deleteFunction}
                  name={sig}
                  projectId={projectId}
                  schema={"public"}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xl">Parameters</p>
        <div className="mt-1 font-mono text-xs text-foreground/90 truncate flex flex-col gap-2">
          {sig
            .split("(")[1]
            .split(", ")
            .map((arg) => {
              if (arg.includes(")")) arg = arg.split(")")[0];
              return (
                <div key={Math.random()} className="flex items-center gap-2 w-md">
                  <Input value={arg.split(" ")[0]} disabled className="cursor-not-allowed" />
                  <Input value={arg.split(" ")[1]} disabled className="cursor-not-allowed" />
                </div>
              );
            })}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xl">Definition (Omit BEGIN and END)</p>

        {/* IMPORTANT: no max-h / no editor scroll container */}
        <div className="relative mt-1">
          <div className="absolute top-0 right-0 z-10 flex gap-1 p-1">
            <Button size="sm" variant="outline" disabled={!hasChanges} onClick={handleUndo}>
              Undo
            </Button>
            <Button size="sm" variant="secondary" disabled={!hasChanges} onClick={() => handleSave({ newBody: funcBody })}>
              Save
            </Button>
          </div>

          {/* wrapper controls height */}
          <div
            className={cn(
              "rounded-md overflow-hidden", // hide any internal overflow
              "border bg-white/90 dark:bg-black/5"
            )}
            style={{ height: editorHeight }}
          >
            <Editor
              value={funcBody}
              theme="vs-dark"
              language="sql"
              onChange={(value) => setFuncBody(value ?? "")}
              onMount={handleMount}
              options={{
                minimap: { enabled: false },

                // Remove ALL scrollbars + scrolling behavior
                scrollbar: {
                  vertical: "hidden",
                  horizontal: "hidden",
                  handleMouseWheel: false,
                  alwaysConsumeMouseWheel: false,
                },

                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,

                wordWrap: "on",
                wrappingStrategy: "advanced",
                scrollBeyondLastLine: false,

                // keeps layout width in sync; we manage height ourselves
                automaticLayout: true,

                // extra: makes it feel like a text area
                lineNumbers: "on",
                glyphMargin: false,
                folding: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionCard;