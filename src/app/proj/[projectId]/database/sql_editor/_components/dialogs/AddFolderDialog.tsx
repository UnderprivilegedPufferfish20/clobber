'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FilePlusIcon, Folder, FolderPlusIcon, Loader2, PlusIcon, Table2 } from 'lucide-react';
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
import { createFolderSchema } from '@/lib/types/schemas';
import { createFolder } from '@/lib/actions/database/sql';

const AddFolderDialog = ({ 
  projectId, open, onOpenChange, hideTrigger
}: {
  projectId: string, open: boolean; onOpenChange: any, hideTrigger: any,
}) => {
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof createFolderSchema>>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createFolderSchema>) => 
      createFolder(form, projectId),
    onSuccess: () => {
      toast.success("Query Added", { id:"create-Query" });
      form.reset()
      onOpenChange(false);
      queryClient.invalidateQueries(['queries'] as any)
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Query Added", { id:"create-Query" });
        onOpenChange(false);
        return;
      }
      toast.error("Failed to Create Query", { id:"create-Query" })
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof createFolderSchema>) => {
      toast.loading("Creating...", { id:"create-Query" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <FilePlusIcon />
            <p>Create Query</p>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={Folder}
          title={'Create Folder'}
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
                      Folder Name
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field}/>
                    </FormControl>
                    <FormDescription>
                      Enter the name of the new folder.
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

export default AddFolderDialog;