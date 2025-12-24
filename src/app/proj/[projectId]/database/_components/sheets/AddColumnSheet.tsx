'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Columns } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createColumnSchema } from '@/lib/types/schemas'
import { addColumn } from '@/lib/actions/database/actions'
import CustomDialogHeader from '@/components/CustomDialogHeader'
import { DATA_TYPES_LIST } from '@/lib/constants'

function AddColumnSheet({
  projectId,
  tableId,
  schema, // Ensure you pass the schema name (e.g., 'public')
  open,
  onOpenChange,
  hideTrigger
}: {
  hideTrigger: boolean;
  tableId: string;
  projectId: string;
  schema: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof createColumnSchema>>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: {
      name: "",
      dtype: "string",
      isArray: false,
      isPkey: false,
      isUnique: false,
      isNullable: true,
      default: ""
    }
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: z.infer<typeof createColumnSchema>) =>
      addColumn(values, schema, projectId, tableId),
    onSuccess: () => {
      toast.success("Column added successfully", { id: "add-column" });
      form.reset();
      onOpenChange(false);
      queryClient.invalidateQueries(['table-details', tableId] as any);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add column", { id: "add-column" });
    }
  })

  const onSubmit = useCallback((values: z.infer<typeof createColumnSchema>) => {
    toast.loading("Adding column...", { id: "add-column" });
    mutate(values);
  }, [mutate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button variant="outline">Add Column</Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-md overflow-y-auto p-2 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader 
            icon={Columns}
            title="Add New Column"
          />
          <SheetDescription>
            Define the properties for your new PostgreSQL column.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Column Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. user_email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data Type */}
            <FormField
              control={form.control}
              name="dtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Default Value */}
            <FormField
              control={form.control}
              name="default"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Value (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 'anonymous' or 0" {...field} />
                  </FormControl>
                  <FormDescription>Leave blank for NULL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Constraints Grid */}
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
              <FormField
                control={form.control}
                name="isNullable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Nullable</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPkey"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Primary Key</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isUnique"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Unique</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isArray"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Is Array</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin mr-2" /> : "Create Column"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default AddColumnSheet;
