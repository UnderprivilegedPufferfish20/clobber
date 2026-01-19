"use client";

import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Columns, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATA_TYPES, DatabaseFunctionType, DatabaseObjectAddSheetProps, FUNCTION_RETURN_TYPES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn, extractBody } from "@/lib/utils";
import { createFunction, editFunction } from "@/lib/actions/database/functions";
import SheetWrapper from "@/components/SheetWrapper";
import { getSchemas } from "@/lib/actions/database/cache-actions";
import SheetSchemaSelect from "../../../_components/selectors/SheetSchemaSelect";

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
          disabled
          onValueChange={setReturnType}
          value={returnType.toUpperCase() as FUNCTION_RETURN_TYPES}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent className="z-110">
            {Object.values(FUNCTION_RETURN_TYPES).map((type) => (
              <SelectItem key={type} value={type}>
                {type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Arguments</h1>
 

        {args.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No arguments yet. Add one if your function needs inputs.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {args.length !== 1 && args.map((arg, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-md border bg-background p-2",
                  "flex items-start gap-2",
                )}
              >
                {/* Arg name */}
                <div className="flex-1">
                  <Input
                    disabled
                    className="cursor-not-allowed"
                    placeholder={`arg_${index + 1}`}
                    value={arg.name}
                  
                  />
                </div>

                {/* Arg type */}
                <div className="w-44">
                  <Select
                    
                    value={arg.dtype}
                  >
                    <SelectTrigger
                      disabled
                      className="cursor-not-allowed"
                    >
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent className="z-110">
                      {Object.values(DATA_TYPES).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
        <Textarea
          placeholder={`-- example\nRETURN 1;`}
          className="min-h-[180px] font-mono"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
      </div>
    </SheetWrapper>
  );
}

export default EditFunctionSheet;