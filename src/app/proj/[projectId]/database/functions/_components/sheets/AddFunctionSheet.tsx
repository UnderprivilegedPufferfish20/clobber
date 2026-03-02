"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  LucideIcon, 
  Plus, 
  Trash2,
  Type, 
  Hash, 
  Binary, 
  CheckSquare, 
  Calendar, 
  Database, 
  Braces, 
  Slash, 
  TableProperties, 
  Zap
 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATA_TYPES, FUNCTION_RETURN_TYPES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createFunction } from "@/lib/actions/database/functions";
import SheetWrapper from "@/components/SheetWrapper";
import SheetSchemaSelect from "../../../_components/selectors/SheetSchemaSelect";
import DataTypeSelect from "../../../_components/DataTypeSelect";
import CodeMirror from "@uiw/react-codemirror"
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { linter, lintGutter } from "@codemirror/lint";

function AddFunctionSheet({
  projectId,
  open,
  onOpenChange
}: {
  projectId: string,
  open: boolean, 
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [schema, setSchema] = useState("");
  const [returnType, setReturnType] = useState<FUNCTION_RETURN_TYPES | string>(FUNCTION_RETURN_TYPES.BOOL);
  const [args, setArgs] = useState<{ name: string; dtype: DATA_TYPES }[]>([]);
  const [definition, setDefinition] = useState("");

  const functionReturnTypeToIcon = (t: FUNCTION_RETURN_TYPES): LucideIcon => {
    switch (t) {
      case FUNCTION_RETURN_TYPES.STRING:
        return Type;
      case FUNCTION_RETURN_TYPES.INT:
        return Hash;
      case FUNCTION_RETURN_TYPES.FLOAT:
        return Binary; // Represents precision/decimals
      case FUNCTION_RETURN_TYPES.BOOL:
        return CheckSquare;
      case FUNCTION_RETURN_TYPES.DateTime:
        return Calendar;
      case FUNCTION_RETURN_TYPES.BYTES:
        return Database;
      case FUNCTION_RETURN_TYPES.JSON:
        return Braces;
      case FUNCTION_RETURN_TYPES.VOID:
        return Slash;
      case FUNCTION_RETURN_TYPES.RECORD:
        return TableProperties;
      case FUNCTION_RETURN_TYPES.TRIGGER:
        return Zap;
      default:
        return Type;
    }
  };


  const getReturnTypeDescription = (t: FUNCTION_RETURN_TYPES): string => {
    switch (t) {
      case FUNCTION_RETURN_TYPES.STRING:
        return "Textual data or character sequences.";
      case FUNCTION_RETURN_TYPES.INT:
        return "Whole numbers without fractional components.";
      case FUNCTION_RETURN_TYPES.FLOAT:
        return "Numbers with variable precision decimals.";
      case FUNCTION_RETURN_TYPES.BOOL:
        return "Logical true or false values.";
      case FUNCTION_RETURN_TYPES.DateTime:
        return "A specific point in time, with or without timezone.";
      case FUNCTION_RETURN_TYPES.BYTES:
        return "Raw binary data storage (bytea).";
      case FUNCTION_RETURN_TYPES.JSON:
        return "Structured JSON or JSONB data.";
      case FUNCTION_RETURN_TYPES.VOID:
        return "Returns no value; used for side-effect functions.";
      case FUNCTION_RETURN_TYPES.RECORD:
        return "An unstructured row or composite type.";
      case FUNCTION_RETURN_TYPES.TRIGGER:
        return "A special type for functions invoked by database events.";
      default:
        return "Unknown return type.";
    }
  };


  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const obj = {
        args,
        name,
        definition,
        return_type: returnType,
        schema,
      };

      console.log("@CREATE FUNCTIONOBJECT: ", obj)

      return createFunction(
        obj,
        projectId
      );
    },
    onSuccess: () => {
      toast.success("Function added successfully", { id: "add-function" });
      queryClient.invalidateQueries(["functions", projectId, schema] as any);
      setName("");
      setSchema("");
      setReturnType("");
      setArgs([]);
      setDefinition("");
      onOpenChange?.(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add function", {
        id: "add-function",
      });
    },
  });

  const handleAddArg = () => {
    setArgs((prev) => [...prev, { name: "", dtype: DATA_TYPES.CHARACTER_VARYING }]);
  };

  const handleRemoveArg = (index: number) => {
    setArgs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateArgName = (index: number, value: string) => {
    setArgs((prev) =>
      prev.map((arg, i) => (i === index ? { ...arg, name: value } : arg))
    );
  };

  const handleUpdateArgType = (index: number, value: DATA_TYPES) => {
    setArgs((prev) =>
      prev.map((arg, i) => (i === index ? { ...arg, dtype: value } : arg))
    );
  };

  const TypeIcon = useMemo(() => {
    return functionReturnTypeToIcon(returnType as FUNCTION_RETURN_TYPES)
  }, [returnType])


  return (
    <SheetWrapper
      disabled={!name || !schema || !returnType || !definition}
      isDirty={() => Boolean(name || schema || returnType !== FUNCTION_RETURN_TYPES.BOOL || definition)}
      onOpenChange={onOpenChange}
      onSubmit={() => mutate()}
      open={open}
      submitButtonText="Create Function"
      title="Create Function"
      description="Reusable block of code"
      isPending={isPending}
      onDiscard={() => {
        setArgs([])
        setDefinition("")
        setName("")
        setReturnType(FUNCTION_RETURN_TYPES.BOOL)
        setSchema("")
      }}
    >
      <div className="flex flex-col gap-2">
        <h1>Name</h1>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="fullwidth"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1>Schema</h1>
        <SheetSchemaSelect 
          projectId={projectId}
          onValueChange={setSchema}
          value={schema}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1>Return Type</h1>
        <Select
          onValueChange={setReturnType}
          value={returnType}
        >
          <SelectTrigger className="fullwidth">
            <div className="flex items-center gap-2">
              <TypeIcon className="w-5 h-5"/>
              <p>{returnType}</p>
            </div>
          </SelectTrigger>
          <SelectContent className="z-110">
            {Object.values(FUNCTION_RETURN_TYPES).map((type) => {

              const I = functionReturnTypeToIcon(type)
              const def = getReturnTypeDescription(type)

              return (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <I className="w-5 h-5"/>
                      <p>{type}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{def}</p>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center fullwidth justify-between">
          <h1>Arguments</h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddArg}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add argument
          </Button>
        </div>

        {args.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No arguments yet. Add one if your function needs inputs.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {args.map((arg, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-md border bg-background p-2",
                  "flex items-start gap-2"
                )}
              >
                {/* Arg name */}
                  <Input
                    placeholder={`arg_${index + 1}`}
                    value={arg.name}
                    onChange={(e) => handleUpdateArgName(index, e.target.value)}
                  />

                  <DataTypeSelect 
                    onValueChange={(value) => handleUpdateArgType(index, value as DATA_TYPES)}
                    value={arg.dtype}
                    triggerClassname="w-50 min-w-50 max-w-50"
                  />

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5"
                  onClick={() => handleRemoveArg(index)}
                  aria-label="Remove argument"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Signature preview */}
        <div className="mt-3 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
          Signature preview:{" "}
          <span className="font-mono text-foreground">
            {name}(
            {args
              .filter((a) => a?.name || a?.dtype)
              .map(
                (a) =>
                  `${a?.name || "arg"} ${String(
                    a?.dtype || ""
                  ).toLowerCase()}`
              )
              .join(", ")}
            )
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Definition (Omit "BEGIN" and "END")</h1>

        <CodeMirror 
          className="min-h-45 font-mono text-sm [&_.cm-editor]:bg-background! [&_.cm-gutters]:bg-background! [&_.cm-gutters]:border-r-none!"
          value={definition}
          onChange={v => setDefinition(v)}
          theme={"none"}
          placeholder={'-- example RETURN 1;'}
          
          extensions={[sql({dialect: PostgreSQL }), lintGutter()]}
        />
      </div>
    </SheetWrapper>
  );
}

export default AddFunctionSheet;