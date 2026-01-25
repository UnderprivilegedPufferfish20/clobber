"use client";

import React, { Dispatch, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

import { createEnum, editEnum } from "@/lib/actions/database/enums";
import { DatabaseObjectAddSheetProps, EnumType } from "@/lib/types";
import SheetWrapper from "@/components/SheetWrapper";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getSchemas } from "@/lib/actions/database/cache-actions";
import SheetSchemaSelect from "../../../_components/selectors/SheetSchemaSelect";

function EditEnumSheet({
  projectId,
  open,
  editingEnum,
  onOpenChange,
}: {
  projectId: string,
  open: boolean,
  editingEnum: EnumType,
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {
  const queryClient = useQueryClient();

  console.log("@ EDITING ENUM: ", editingEnum)

  const initialValues = editingEnum.enum_values.split(", ");

  const [name, setName] = useState(editingEnum.enum_name);
  const [schema, setSchema] = useState(editingEnum.enum_schema);
  const [values, setValues] = useState<string[]>(initialValues);
  const [renamedVals, setRenamedVals] = useState<{ oldName: string, newName: string }[]>([])

  const { mutate, isPending } = useMutation({
    mutationFn: async () =>
      editEnum(
        editingEnum,
        {
          enum_name: name,
          enum_schema: schema,
          enum_values: values.join(", ")
        },
        renamedVals,
        projectId
      ),
    onSuccess: () => {
      toast.success("Enum updated successfully", { id: "update-enum" });
      queryClient.invalidateQueries(["enums", projectId, schema] as any);

      setName(editingEnum.enum_name);
      setValues(editingEnum.enum_values.split(", "));
      setSchema(editingEnum.enum_schema);
      setRenamedVals([]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update enum", { id: "update-enum" });
    },
    onMutate: () => { toast.loading("Updating...", { id:'update-enum' }) }
  });

  const handleAddValue = () => {
    setValues((prev) => [...prev, ""]);
  };

  const handleUpdateValue = (index: number, value: string) => {
    setValues((prev) =>
      prev.map((v, i) => (i === index ? value : v))
    );

    if (index >= initialValues.length) {
      // New value, no rename needed
      return;
    }

    const oldName = initialValues[index];

    if (value === oldName) {
      // Remove from renamedVals if exists
      setRenamedVals((prev) => prev.filter((r) => r.oldName !== oldName));
    } else {
      // Add or update renamedVals
      setRenamedVals((prev) => {
        const existing = prev.find((r) => r.oldName === oldName);
        if (existing) {
          return prev.map((r) =>
            r.oldName === oldName ? { oldName, newName: value } : r
          );
        } else {
          return [...prev, { oldName, newName: value }];
        }
      });
    }
  };


  return (
    <SheetWrapper
      title="Edit Enum"
      disabled={name === editingEnum.enum_name && schema === editingEnum.enum_schema &&  editingEnum.enum_values === values.join(", ")}
      isDirty={() => name !== editingEnum.enum_name || schema !== editingEnum.enum_schema || editingEnum.enum_values !== values.join(", ")}
      onOpenChange={onOpenChange}
      open={open}
      onSubmit={() => mutate()}
      onDiscard={() => {
        setName(editingEnum.enum_name);
        setValues(editingEnum.enum_values.split(", "));
        setSchema(editingEnum.enum_schema);
        setRenamedVals([]);
      }}
      submitButtonText="Apply Changes"
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

        <SheetSchemaSelect 
          projectId={projectId}
          value={schema}
          onValueChange={setSchema}
        />
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
                  "flex items-center gap-2"
                )}
              >
                <div className="flex-1">
                  <Input
                    placeholder={`value_${index + 1}`}
                    value={value}
                    onChange={(e) => handleUpdateValue(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SheetWrapper>
  );
}

export default EditEnumSheet;