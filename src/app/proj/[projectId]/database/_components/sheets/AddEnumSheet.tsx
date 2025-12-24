"use client";

import React, { useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, BookTypeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createEnumSchema } from "@/lib/types/schemas";
import { createEnum } from "@/lib/actions/database/actions";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function AddEnumSheet({
  projectId,
  schemas,
  open,
  onOpenChange,
  hideTrigger,
}: {
  hideTrigger: boolean;
  projectId: string;
  schemas: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [selectedSchema, setSelectedSchema] = React.useState<string>(
    schemas?.[0] ?? "public"
  );

  const form = useForm<z.infer<typeof createEnumSchema>>({
    resolver: zodResolver(createEnumSchema),
    defaultValues: {
      name: "",
      values: [""], // start with one row so the UI is obvious
    },
    mode: "onSubmit",
  });

  const valuesArray = useFieldArray({
    control: form.control,
    name: "values" as never,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: z.infer<typeof createEnumSchema>) =>
      createEnum(payload, projectId, selectedSchema),
    onSuccess: () => {
      toast.success("Enum added successfully", { id: "add-enum" });
      form.reset({ name: "", values: [""] });
      onOpenChange(false);
      queryClient.invalidateQueries(["enums", projectId, selectedSchema] as any);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add enum", { id: "add-enum" });
    },
  });

  const onSubmit = useCallback(
    (payload: z.infer<typeof createEnumSchema>) => {
      toast.loading("Adding enum...", { id: "add-enum" });

      // optional: trim + drop empties so you don't create invalid enums accidentally
      const cleaned = {
        ...payload,
        values: (payload.values ?? [])
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
      };

      mutate(cleaned);
    },
    [mutate]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button variant="outline" className="bg-indigo-500 text-white">
            Create Enum
          </Button>
        </SheetTrigger>
      )}

      <SheetContent className="sm:max-w-md overflow-y-auto p-2 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader icon={BookTypeIcon} title="Create Enum" />
          <SheetDescription>
            Define the enum name and the set of allowed values.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Enum Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enum Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. user_status" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schema */}
            <FormItem>
              <FormLabel>Schema</FormLabel>
              <Select
                onValueChange={setSelectedSchema}
                value={selectedSchema}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="z-200">
                  {(schemas ?? []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The enum will be created inside this schema.
              </FormDescription>
            </FormItem>

            <Separator />

            {/* Values list */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <FormLabel>Values</FormLabel>
                  <FormDescription>
                    Add one value per row (e.g. <span className="font-mono">active</span>,{" "}
                    <span className="font-mono">inactive</span>).
                  </FormDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => valuesArray.append("")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add value
                </Button>
              </div>

              {valuesArray.fields.length === 0 ? (
                <div className="mt-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No values yet. Add at least one value.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {valuesArray.fields.map((row, index) => (
                    <div
                      key={row.id}
                      className={cn(
                        "rounded-md border bg-background p-2",
                        "flex items-start gap-2"
                      )}
                    >
                      <FormField
                        control={form.control}
                        name={`values.${index}` as const}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="sr-only">Value</FormLabel>
                            <FormControl>
                              <Input placeholder={`value_${index + 1}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0.5"
                        onClick={() => valuesArray.remove(index)}
                        aria-label="Remove value"
                        disabled={valuesArray.fields.length === 1}
                        title={
                          valuesArray.fields.length === 1
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
                  {selectedSchema || "schema"}.{form.watch("name") || "enum_name"} = [
                  {(form.watch("values") ?? [])
                    .map((v) => v?.trim())
                    .filter(Boolean)
                    .join(", ")}
                  ]
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Enum"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default AddEnumSheet;