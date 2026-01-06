'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, PlusIcon, Table2 } from 'lucide-react';
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
import { createTableSchema } from '@/lib/types/schemas';
import { addTable } from '@/lib/actions/database/tables';

const AddTableDialog = ({ 
  triggerText, 
  projectId,
  schema 
}: {
  triggerText?: string;
  projectId: string;
  schema: string
}) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof createTableSchema>>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createTableSchema>) => 
      addTable(form, projectId, schema),
    onSuccess: () => {
      toast.success("Table Added", { id:"create-table" });
      form.reset()
      setOpen(false);
      queryClient.invalidateQueries(['tables'] as any)
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Table Added", { id:"create-table" });
        setOpen(false);
        return;
      }
      toast.error("Failed to Create table", { id:"create-table" })
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof createTableSchema>) => {
      toast.loading("Creating...", { id:"create-table" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
            className='bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 flex items-center justify-center border-2 h-9 w-10'
            variant={'outline'}
        >
            <PlusIcon />
            {triggerText}
        </Button> 
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={Table2}
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
                      Table Name
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field}/>
                    </FormControl>
                    <FormDescription>
                      Enter the name of the new table.
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

export default AddTableDialog;