"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  LucideIcon, 
  Type, 
  Hash, 
  Binary, 
  CheckSquare, 
  Calendar, 
  Database, 
  Braces, 
  Slash, 
  TableProperties, 
  Zap,
  Trash2
 } from "lucide-react";
 import CodeMirror from "@uiw/react-codemirror"
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATA_TYPES, DatabaseFunctionType, FUNCTION_RETURN_TYPES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { cn, extractBody } from "@/lib/utils";
import { editFunction } from "@/lib/actions/database/functions";
import SheetWrapper from "@/components/SheetWrapper";
import { getSchemas } from "@/lib/actions/database/cache-actions";
import SheetSchemaSelect from "../../../_components/selectors/SheetSchemaSelect";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { lintGutter } from "@codemirror/lint";
import { Button } from "@/components/ui/button";
import DataTypeSelect from "../../../_components/DataTypeSelect";

function EditFunctionSheet({
  projectId,
  open,
  editingFunction,
  onOpenChange
}: {
  projectId: string,
  open: boolean,
  editingFunction: DatabaseFunctionType
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {
  console.log("@EDITING FUNCTION: ", editingFunction)

  const queryClient = useQueryClient();

  

  

  const [name, setName] = useState(editingFunction.function_name);
  const [schema, setSchema] = useState(editingFunction.schema_name);
  const [returnType, setReturnType] = useState<FUNCTION_RETURN_TYPES | string>(editingFunction.return_type);
  const [args, setArgs] = useState<{ name: string; dtype: DATA_TYPES }[]>(editingFunction.arguments.split(", ").map(a => ({name: a.split(" ")[0], dtype: a.split(" ")[1] as DATA_TYPES})));
  const [definition, setDefinition] = useState(extractBody(editingFunction.definition));

  const { data: schemas, isPending: isSchemasPending } = useQuery({
    queryKey: ['schemas', projectId],
    queryFn: () => getSchemas(projectId)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return editFunction(
        editingFunction,
        { arguments: args.map(a => `${a.name}, ${a.dtype}`).join(", "), return_type: returnType, definition: definition, function_name: name, schema_name: schema},
        projectId
      );
    },
    onSuccess: () => {
      toast.success("Function updated successfully", { id: "update-function" });
      queryClient.invalidateQueries(["functions", projectId, schema] as any);

      setDefinition(extractBody(editingFunction.definition))
      setName(editingFunction.function_name)
      setSchema(editingFunction.schema_name)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update function", {
        id: "update-function",
      });
    },
    onMutate: () => { toast.loading("Updating...", { id: "update-function" }) }
  });

  const isDirty = () => {
    return name !== editingFunction.function_name || schema !== editingFunction.schema_name || definition !== extractBody(editingFunction.definition)
  }

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

    const TypeIcon = useMemo(() => {
      return functionReturnTypeToIcon(returnType as FUNCTION_RETURN_TYPES)
    }, [returnType])

  return (
    <SheetWrapper
      disabled={!isDirty()}
      isDirty={isDirty}
      onOpenChange={onOpenChange}
      onSubmit={() => mutate()}
      open={open}
      submitButtonText="Apply Changes"
      title="Edit Function"
      isPending={isPending}
      onDiscard={() => {
        setDefinition(extractBody(editingFunction.definition))
        setName(editingFunction.function_name)
        setSchema(editingFunction.schema_name)
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
        <h1>Arguments</h1>
 

        {args.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No arguments.
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
                    disabled
                    onChange={() => {}}
                  />

                  <DataTypeSelect 
                    disabled
                    onValueChange={() => {}}
                    value={arg.dtype}
                    triggerClassname="w-50 min-w-50 max-w-50"
                  />

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 cursor-not-allowed"
                  disabled
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
          theme={"none"}
          placeholder={'-- example RETURN 1;'}
          
          extensions={[sql({dialect: PostgreSQL }), lintGutter()]}
        />
      </div>
    </SheetWrapper>
  );
}

export default EditFunctionSheet;