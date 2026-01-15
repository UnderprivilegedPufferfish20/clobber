"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createEnum } from "@/lib/actions/database/enums";
import { DatabaseObjectAddSheetProps } from "@/lib/types";
import SheetWrapper from "@/components/SheetWrapper";
import { cn } from "@/lib/utils";
import { useState } from "react";

function AddEnumSheet({
  projectId,
  schemas,
  open,
  onOpenChange,
}: DatabaseObjectAddSheetProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [schema, setSchema] = useState("");
  const [values, setValues] = useState<string[]>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () =>
      createEnum(
        {
          name,
          values,
        },
        projectId,
        schema
      ),
    onSuccess: () => {
      toast.success("Enum added successfully", { id: "add-enum" });
      queryClient.invalidateQueries(["enums", projectId, schema] as any);
      setName("");
      setSchema("");
      setValues([]);
      onOpenChange?.(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add enum", { id: "add-enum" });
    },
  });

  const handleAddValue = () => {
    setValues((prev) => [...prev, ""]);
  };

  const handleRemoveValue = (index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateValue = (index: number, value: string) => {
    setValues((prev) =>
      prev.map((v, i) => (i === index ? value : v))
    );
  };

  const handleSubmit = () => {
    if (!name || !schema || values.length === 0) {
      toast.error("Name, schema, and at least one value are required");
      return;
    }
    mutate();
  };

  return (
    <SheetWrapper
      title="Create Enum"
      description="Data type with list of possible values"
      disabled={false}
      onOpenChange={onOpenChange}
      open={open}
      onSubmit={handleSubmit}
      onDiscard={() => {
        setName("");
        setValues([]);
        setSchema("");
      }}
      submitButtonText="Create Enum"
      isPending={isPending}
    >
      <div className="flex flex-col gap-2">
        <h1>Name</h1>

        <Input
          className="fullwidth"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1>Schema</h1>

        <Select
          onValueChange={setSchema}
          value={schema}
        >
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

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Values</h2>
            <p className="text-sm text-muted-foreground">
              Add one value per row (e.g. <span className="font-mono">active</span>,{" "}
              <span className="font-mono">inactive</span>).
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddValue}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add value
          </Button>
        </div>

        {values.length === 0 ? (
          <div className="mt-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No values yet. Add at least one value.
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {values.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-md border bg-background p-2",
                  "flex items-start gap-2"
                )}
              >
                <div className="flex-1">
                  <Input
                    placeholder={`value_${index + 1}`}
                    value={value}
                    onChange={(e) => handleUpdateValue(index, e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5"
                  onClick={() => handleRemoveValue(index)}
                  aria-label="Remove value"
                  disabled={values.length === 1}
                  title={
                    values.length === 1
                      ? "At least one value is required"
                      : "Remove value"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
          Preview:{" "}
          <span className="font-mono text-foreground">
            {schema || "schema"}.{name || "enum_name"} = [
            {values
              .map((v) => v?.trim())
              .filter(Boolean)
              .join(", ")}
            ]
          </span>
        </div>
      </div>
    </SheetWrapper>
  );
}

export default AddEnumSheet;