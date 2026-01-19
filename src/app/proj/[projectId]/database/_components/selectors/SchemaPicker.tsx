// SchemaPicker.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, MaximizeIcon, PlusIcon, Table2 } from 'lucide-react';
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form';
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createSchemaScheam, createTableSchema } from '@/lib/types/schemas';
import { addSchema } from '@/lib/actions/database/actions';

type ComboboxButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  expanded: boolean;
  text: React.ReactNode;
};

const ComboboxButton = React.forwardRef<HTMLButtonElement, ComboboxButtonProps>(
  ({ expanded, text, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      role="combobox"
      aria-expanded={expanded}
      className={cn(
        "bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 w-fit justify-between items-center border-none shadow-none text-sm text-muted-foreground hover:text-foreground",
        props.className
      )}
      {...props}
    >
      {text}
      {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </Button>
  )
);
ComboboxButton.displayName = "ComboboxButton";

type SchemaPickerProps = {
  schemas: string[];
  value: string;
  onChange: (schema: string) => void;
};

const SchemaPicker = ({ schemas, value, onChange }: SchemaPickerProps) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [open, setOpen] = React.useState(false);

  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<z.infer<typeof createSchemaScheam>>({
    resolver: zodResolver(createSchemaScheam),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createSchemaScheam>) => 
      addSchema(projectId, form),
    onSuccess: () => {
      toast.success("Schema Added", { id:"create-Schema" });
      form.reset()
      setOpen(false);
      queryClient.invalidateQueries(['schemas'] as any)
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Schema Added", { id:"create-Schema" });
        setOpen(false);
        return;
      }
      toast.error("Failed to Create Schema", { id:"create-Schema" })
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof createSchemaScheam>) => {
      toast.loading("Creating...", { id:"create-Schema" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ComboboxButton
            expanded={open}
            className="border-2 w-48 justify-between"
            onClick={() => setOpen((v) => !v)}
            text={
              <p className="text-muted-foreground truncate">
                schema <span className="dark:text-white text-black ml-1">{value}</span>
              </p>
            }
          />
        </PopoverTrigger>

        <PopoverContent className="w-[260px] p-0 z-200" align="start">
          <Command>
            <CommandInput placeholder="Search schema..." className="h-9" />
            <CommandList>
              <CommandEmpty>
                No schemas found.
              </CommandEmpty>

              <CommandGroup>
                {schemas.map((row) => {
                  const selected = value === row;
                  return (
                    <CommandItem
                      key={row}
                      value={row}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                    >
                      {row}
                      <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandGroup>
                <Separator />
                <Button
                  variant={"ghost"}
                  onClick={() => setIsCreateOpen(true)}
                  className="fullwidth flex items-center justify-start gap-2 mt-2"
                >
                  <PlusIcon className="w-4 h-4"/>
                  Create Schema
                </Button>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='px-0'>
          <CustomDialogHeader 
            icon={MaximizeIcon}
            title={'Create Schema'}
          />
          <div className="p-6">
            <Form {...form}>
              <form 
                className='space-y-8 w-full'
                onSubmit={form.handleSubmit(onSubmit)}
              >

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex gap-1 items-center'>
                        Schema Name
                        <p className="text-xs text-primary">(required)</p>
                      </FormLabel>
                      <FormControl>
                        <Input {...field}/>
                      </FormControl>
                      <FormDescription>
                        Enter the name of the new schema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type='submit' className='w-full' disabled={isPending}>
                  {!isPending && "Proceed"}
                  {isPending && <Loader2 className='animate-spin' />}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchemaPicker;
