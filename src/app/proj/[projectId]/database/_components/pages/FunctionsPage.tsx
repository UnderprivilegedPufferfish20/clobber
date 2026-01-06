"use client";

import { Separator } from "@/components/ui/separator";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import type * as monacoType from "monaco-editor";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../dialogs/DeleteDialog";
import SchemaPicker from "../SchemaPicker";
import { Input } from "@/components/ui/input";
import AddFunctionSheet from "../sheets/AddFunctionSheet";
import { InboxIcon, Search, FunctionSquare, EllipsisVerticalIcon, PencilIcon, ChevronsUpDown } from "lucide-react";
import { DATA_TYPES } from "@/lib/types";
import { getPostgresType, mapPostgresType } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Editor } from "@monaco-editor/react";
import { toast } from "sonner";
import { Popover } from "@/components/ui/popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { changeFunctionSchema, renameFunction, createFunction, deleteFunction } from "@/lib/actions/database/functions";

type Props = {
  projectId: string;
  schemas: string[];
  functions: any[]
};

const FunctionsPage = ({ projectId, schemas, functions }: Props) => {
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

  const filteredFuncs = useMemo(() => {
    if (!functions) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return functions;

    return functions.filter((f) =>
      f.function_name.toLowerCase().includes(q)
    );
  }, [searchTerm, functions]);

  const showEmptySchemaState = !searchTerm && (functions?.length ?? 0) === 0;
  const showNoMatchesState = !!searchTerm && filteredFuncs.length === 0;

  return (
    <div className="fullscreen flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl">Functions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Functions are reusable bits of code that do a specific job.
          </p>
        </div>

        <AddFunctionSheet
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
              placeholder="Search functions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <SchemaPicker schemas={schemas ?? []} value={schema} onChange={setSchema} />
        </div>

        <div className="text-xs text-muted-foreground">
          {`${filteredFuncs.length} function${filteredFuncs.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* CONTENT */}
      {showEmptySchemaState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <InboxIcon size={96} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">No functions in “{schema}”</h2>
            <p className="text-muted-foreground text-sm">
              Create your first function to start adding server-side logic.
            </p>
          </div>

          <AddFunctionSheet
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
              No functions match “{searchTerm.trim()}”.
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
          {filteredFuncs.map((f: any) => (
            <FunctionCard
              schemas={schemas}
              key={`${f.function_name}:${f.arguments ?? ""}`}
              name={f.function_name}
              returnType={f.data_type}
              args={f.arguments}
              schema={schema}
              definition={f.definition}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FunctionsPage;

const FunctionCard = ({
  name,
  returnType,
  args,
  schema,
  schemas,
  definition,
}: {
  name: string;
  returnType: string;
  args: string;
  schema: string;
  schemas: string[];
  definition: string;
}) => {
  let sig = `${name}(${args || ""})`;
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [schemaOpen, setSchemaOpen] = React.useState(false)

  

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
  const [editedName, setEditedName] = useState(name)
  const [isEditingSchema, setIsEditingSchema] = useState(false)
  const [editedSchema, setEditedSchema] = useState(schema)
  const [funcBody, setFuncBody] = useState(initialBody);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // put near your state
  const otherSchemas = React.useMemo(
    () => schemas.filter((s) => s !== editedSchema),
    [schemas, editedSchema]
  );


  const hasChanges = funcBody !== initialBody;

  const handleUndo = () => setFuncBody(initialBody);

  const handleSave = async (props: { newSchema?: string, newName?: string, newBody?: string } ) => {
    console.log("handleSave called");
    if (Object.keys(props).length !== 1) throw new Error("Can only change one thing about func at a time")
    try {
      if (props.newSchema) {
        await changeFunctionSchema(projectId, schema, sig, props.newSchema)
      } else if (props.newName) {
        await renameFunction(projectId, schema, sig, editedName)
      } else {
        await createFunction({
          schema,
          args: sig
            .split("(")[1]
            .split(")")[0]
            .split(", ")
            .filter(Boolean)
            .map((o) => ({
              name: o.split(" ")[0],
              dtype: mapPostgresType(o.split(" ")[1]),
            })),
          definition: funcBody,
          name,
          returnType
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

  const schemaWrapRef = useRef<HTMLDivElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditingSchema) return;

    const onPointerDown = (e: PointerEvent) => {
      const wrap = schemaWrapRef.current;
      const pop = popoverContentRef.current;

      if (!(e.target instanceof Node)) return;

      const clickedInsideWrap = !!wrap && wrap.contains(e.target);
      const clickedInsidePopover = !!pop && pop.contains(e.target);

      if (!clickedInsideWrap && !clickedInsidePopover) {
        setIsEditingSchema(false);
        setSchemaOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isEditingSchema]);



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
                  setEditedName(name)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave({ newName: editedName })
                }}
              />
            ) : (
              <h3 
                className="font-semibold text-2xl truncate"
              >
                {name}
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

          

          <div ref={schemaWrapRef} className="group flex items-center gap-2">
            {isEditingSchema ? (
              <Popover open={schemaOpen} onOpenChange={setSchemaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={schemaOpen}
                    className="w-[200px] justify-between"
                  >
                    {/* ✅ always show the *current* schema */}
                    {editedSchema || "Select schema..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>

                {/* ✅ ref so click-away logic can treat this as “inside” */}
                <PopoverContent ref={popoverContentRef} className="w-[200px] p-0 opacity-100!">
                  <Command className="opacity-100!">
                    {/* optional: better placeholder */}
                    <CommandInput placeholder="Search schemas..." className="opacity-100!" />
                    <CommandList className="opacity-100!">
                      <CommandEmpty>No schema found</CommandEmpty>

                      <CommandGroup heading="Move to" className="opacity-100!">
                        {/* ✅ only show *other* schemas */}
                        {otherSchemas.map((s) => (
                          <CommandItem
                            key={s}
                            value={s}
                            onSelect={() => {
                              setEditedSchema(s);
                              setSchemaOpen(false);
                              setIsEditingSchema(false)
                              handleSave({ newSchema: s })
                            }}
                          >
                            {s}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-lg text-muted-foreground mt-1 truncate">
                <span className="font-mono">{editedSchema}</span>
              </p>
            )}

            <Button
              onClick={() => {
                setIsEditingSchema(true);
                setSchemaOpen(true); // optional: open immediately on edit
              }}
              variant="ghost"
              className={`text-muted-foreground opacity-0 ${
                !isEditingSchema && "group-hover:opacity-100"
              } transition-opacity duration-200 cursor-pointer`}
            >
              <PencilIcon />
            </Button>
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
            RETURNS {returnType}
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
                  schema={schema}
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
                <div key={arg} className="flex items-center gap-2 w-md">
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
