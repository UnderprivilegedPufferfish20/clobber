'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
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

const CreateSchemaDialog = ({ 
  triggerText, 
  projectId,
}: {
  triggerText?: string;
  projectId: string;
}) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
            className='text-black bg-white dark:bg-black/10 dark:text-white w-61 flex items-center justify-baseline border-2 m-1'
            variant={"ghost"}
        >
            <PlusIcon />
            <p>Create Schema</p>
        </Button> 
      </DialogTrigger>
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
  )
}

export default CreateSchemaDialog;