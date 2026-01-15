"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { DATA_TYPES, DatabaseObjectAddSheetProps, FUNCTION_RETURN_TYPES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createFunction } from "@/lib/actions/database/functions";
import SheetWrapper from "@/components/SheetWrapper";

function AddFunctionSheet({
  projectId,
  schemas,
  open,
  onOpenChange
}: DatabaseObjectAddSheetProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [schema, setSchema] = useState("");
  const [returnType, setReturnType] = useState<FUNCTION_RETURN_TYPES | string>("");
  const [args, setArgs] = useState<{ name: string; dtype: DATA_TYPES }[]>([]);
  const [definition, setDefinition] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return createFunction(
        {
          args,
          name,
          definition,
          returnType,
          schema,
        },
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

  const handleSubmit = () => {
    if (!name || !schema) {
      toast.error("Name and schema are required");
      return;
    }
    mutate();
  };

  return (
    <SheetWrapper
      disabled={false}
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
        <Select onValueChange={setSchema} value={schema}>
          <SelectTrigger>
            <SelectValue placeholder="Select schema" />
          </SelectTrigger>
          <SelectContent className="z-200">
            {(schemas ?? []).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Return Type</h1>
        <Select
          onValueChange={setReturnType}
          value={returnType}
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
                <div className="flex-1">
                  <Input
                    placeholder={`arg_${index + 1}`}
                    value={arg.name}
                    onChange={(e) => handleUpdateArgName(index, e.target.value)}
                  />
                </div>

                {/* Arg type */}
                <div className="w-44">
                  <Select
                    onValueChange={(value) => handleUpdateArgType(index, value as DATA_TYPES)}
                    value={arg.dtype}
                  >
                    <SelectTrigger>
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

export default AddFunctionSheet;