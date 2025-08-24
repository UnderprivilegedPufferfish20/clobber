'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { createProjectSchema } from '@/lib/types/schemas/createProjectSchema';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { KeyRoundIcon, Loader2, ServerIcon } from 'lucide-react';
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
import createProject from '@/lib/actions/projects/createProject';

const CreateProjectDialog = ({ triggerText }: {triggerText?: string }) => {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success("Project Created", { id:"create-credential" });
      form.reset()
      setOpen(false);
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Project Created", { id:"create-credential" });
        setOpen(false);
        return;
      }
      toast.error("Failed to create project", { id:"create-credential" })
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof createProjectSchema>) => {
      toast.loading("Creating project...", { id:"create-credential" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <p>{triggerText}</p>
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={ServerIcon}
          title={'Create Project'}
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

export default CreateProjectDialog