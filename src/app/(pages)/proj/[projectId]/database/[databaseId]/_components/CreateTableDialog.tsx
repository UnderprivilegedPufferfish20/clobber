'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { createDatabaseSchema } from '@/lib/types/schemas/createDatabaseSchema';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Grid2x2PlusIcon, Loader2, PlusIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react'
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
import { createTableSchema } from '@/lib/types/schemas/createTableSchema';
import createTable from '@/lib/actions/tables/createTable';
import { useRouter, usePathname } from 'next/navigation';
import { Table } from '@/lib/db/generated';

const CreateTableDialog = ({ 
  triggerText,
  databaseId 
}: {
  triggerText?: string;
  databaseId: string
}) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm<z.infer<typeof createTableSchema>>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createTableSchema>) => 
      createTable(form, databaseId),
    onMutate: async (newTable) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['getDatabase', databaseId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['getDatabase', databaseId]);

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      
      // Optimistically update the cache
      queryClient.setQueryData(['getDatabase', databaseId], (old: any) => {
        if (!old) return old;
        
        const optimisticTable: Table = {
          id: tempId,
          name: newTable.name,
          databaseId: databaseId,
          createdAt: new Date()
          // Add any other required fields from your Table type
        };

        return {
          ...old,
          tables: [...(old.tables || []), optimisticTable]
        };
      });

      // Immediately navigate to the new table
      const params = new URLSearchParams();
      params.set('table', tempId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // Return context for rollback
      return { previousData, tempId };
    },
    onSuccess: (result, variables, context) => {
      toast.success("Table Created", { id:"create-table" });
      form.reset();
      setOpen(false);

      // Update the optimistic entry with real data
      queryClient.setQueryData(['getDatabase', databaseId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          tables: old.tables.map((table: Table) => 
            table.id === context?.tempId 
              ? { ...result } // Replace temp table with real table
              : table
          )
        };
      });

      // Update URL with real table ID
      const params = new URLSearchParams();
      params.set('table', result.id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    onError: (error, variables, context) => {
      console.log("Error details:", error);
      
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['getDatabase', databaseId], context.previousData);
      }

      // Navigate away from the temp table
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('table') === context?.tempId) {
        currentParams.delete('table');
        const newSearch = currentParams.toString();
        const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
        router.replace(newUrl, { scroll: false });
      }

      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Table Created", { id:"create-table" });
        setOpen(false);
        
        // Refetch to get the real data
        queryClient.invalidateQueries({ 
          queryKey: ['getDatabase', databaseId] 
        });
        return;
      }
      
      toast.error("Failed to create Table", { id:"create-table" });
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof createDatabaseSchema>) => {
      toast.loading("Creating Table...", { id:"create-table" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className='fixed left-0 top-0 bottom-0'>
        <button className='bg-transparent flex items-center justify-center border-r-2 hover:bg-accent w-[70px] h-full'>
          <PlusIcon />
        </button>
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={Grid2x2PlusIcon}
          title={'Create Table'}
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
                      Name
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field}/>
                    </FormControl>
                    <FormDescription>
                      Choose a descriptive and unique name.
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
  )
}

export default CreateTableDialog;