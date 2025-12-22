"use client";

import React, { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Columns, Plus, Trash2, ListTreeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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

import { createFunctionSchema } from "@/lib/types/schemas";
import { createFunction } from "@/lib/actions/database/actions";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { DATA_TYPES_LIST } from "@/lib/constants";
import SchemaPicker from "../SchemaPicker";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { DATA_TYPES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function AddIndexSheet({
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

  const { schema, setSchema } = useSelectedSchema({
    projectId,
    schemas,
    persist: true,
  });

  const form = useForm<z.infer<typeof createFunctionSchema>>({
    resolver: zodResolver(createFunctionSchema),
    defaultValues: {
      name: "",
      schema: schema ?? (schemas?.[0] ?? "public"),
      returnType: DATA_TYPES.STRING,
      args: [],
      definition: "",
    },
  });

  // Keep form.schema in sync with selected schema picker
  useEffect(() => {
    const next = schema ?? (schemas?.[0] ?? "public");
    form.setValue("schema", next, { shouldValidate: true, shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, schemas]);

  // Ensure a schema is selected initially (picker state)
  useEffect(() => {
    if (!schema && schemas && schemas.length > 0) {
      setSchema(schemas[0]);
    }
  }, [schemas, schema, setSchema]);

  const argsArray = useFieldArray({
    control: form.control,
    name: "args",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: z.infer<typeof createFunctionSchema>) =>
      createFunction(values, projectId),
    onSuccess: () => {
      toast.success("Index added successfully", { id: "add-Index" });
      form.reset({
        name: "",
        schema: schema ?? (schemas?.[0] ?? "public"),
        returnType: DATA_TYPES.STRING,
        args: [],
        definition: "",
      });
      onOpenChange(false);
      queryClient.invalidateQueries(["functions", projectId, schema] as any);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add Index", {
        id: "add-Index",
      });
    },
  });

  const onSubmit = useCallback(
    (values: z.infer<typeof createFunctionSchema>) => {
      toast.loading("Adding Index...", { id: "add-Index" });
      mutate(values);
    },
    [mutate]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button variant="outline" className="bg-indigo-500 text-white">
            Create Index
          </Button>
        </SheetTrigger>
      )}

      <SheetContent className="sm:max-w-md overflow-y-auto p-2 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader icon={ListTreeIcon} title="Create Index" />
          <SheetDescription>
            Define the properties for your new Postgres Index.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Function Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Index Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. get_user_stats" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schema */}
            <FormField
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schema</FormLabel>
                  <FormControl>
                    <SchemaPicker
                      schemas={schemas ?? []}
                      value={schema}
                      onChange={(v) => {
                        setSchema(v);
                        field.onChange(v);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Return Type */}
            <FormField
              control={form.control}
              name="returnType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-110">
                      {DATA_TYPES_LIST.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* ✅ Arguments UI (replaces the empty name="" field) */}
            <FormField
              control={form.control}
              name="args"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <FormLabel>Arguments</FormLabel>
                      <FormDescription>
                        Optional. These become parameters in your function
                        signature.
                      </FormDescription>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        argsArray.append({ name: "", dtype: DATA_TYPES.STRING })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add argument
                    </Button>
                  </div>

                  {argsArray.fields.length === 0 ? (
                    <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      No arguments yet. Add one if your function needs inputs.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {argsArray.fields.map((row, index) => (
                        <div
                          key={row.id}
                          className={cn(
                            "rounded-md border bg-background p-2",
                            "flex items-start gap-2"
                          )}
                        >
                          {/* Arg name */}
                          <FormField
                            control={form.control}
                            name={`args.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="sr-only">
                                  Argument name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={`arg_${index + 1}`}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Arg type */}
                          <FormField
                            control={form.control}
                            name={`args.${index}.dtype`}
                            render={({ field }) => (
                              <FormItem className="w-44">
                                <FormLabel className="sr-only">
                                  Argument type
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="z-110">
                                    {DATA_TYPES_LIST.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type.toUpperCase()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Remove */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-0.5"
                            onClick={() => argsArray.remove(index)}
                            aria-label="Remove argument"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* A little “signature preview” for intuition */}
                  <div className="mt-3 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    Signature preview:{" "}
                    <span className="font-mono text-foreground">
                      {form.watch("name") || "function_name"}(
                      {(form.watch("args") ?? [])
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

                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Definition */}
            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Definition</FormLabel>
                  <FormDescription>
                    Write the function body in plpgsql. Omit <span className="font-mono">BEGIN</span> and{" "}
                    <span className="font-mono">END;</span>.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={`-- example\nRETURN 1;`}
                      className="min-h-[180px] font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Index"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default AddIndexSheet;
