'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { createDatabaseSchema } from '@/lib/types/schemas/createDatabaseSchema';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CpuIcon, Loader2, ServerIcon } from 'lucide-react';
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
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import createDatabase from '@/lib/actions/database/createDatabase';

const CreateDatabaseDialog = ({ 
  triggerText, 
  projectId 
}: {
  triggerText?: string;
  projectId: string;
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof createDatabaseSchema>>({
    resolver: zodResolver(createDatabaseSchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createDatabaseSchema>) => 
      createDatabase(form, projectId),
    onSuccess: () => {
      toast.success("Database Created", { id:"create-Database" });
      form.reset()
      setOpen(false);
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Database Created", { id:"create-Database" });
        setOpen(false);
        return;
      }
      toast.error("Failed to create Database", { id:"create-Database" })
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof createDatabaseSchema>) => {
      toast.loading("Creating Database...", { id:"create-Database" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={CpuIcon}
          title={'Create Database'}
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

export default CreateDatabaseDialog;