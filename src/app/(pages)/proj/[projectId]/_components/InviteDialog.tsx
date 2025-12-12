'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, UserPlusIcon, Users2Icon } from 'lucide-react';
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
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inviteUsersSchema } from '@/lib/types/schemas';
import { addCollaborator } from '@/lib/actions/projects';

const InviteUsersDialog = ({ 
  triggerText, 
  projectId 
}: {
  triggerText?: string;
  projectId: string;
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof inviteUsersSchema>>({
    resolver: zodResolver(inviteUsersSchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof inviteUsersSchema>) => 
      addCollaborator(form, projectId),
    onSuccess: () => {
      toast.success("Collaborator Added", { id:"invite-user" });
      form.reset()
      setOpen(false);
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Colaborator Added", { id:"invite-user" });
        setOpen(false);
        return;
      }
      toast.error("Failed to Find User", { id:"invite-user" })
    }
  })

  const onSubmit = useCallback(
    (values: z.infer<typeof inviteUsersSchema>) => {
      toast.loading("Inviting...", { id:"invite-user" });
      mutate(values)
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
            className='text-black bg-white flex items-center justify-baseline border-2'
            variant={"ghost"}
        >
            <Users2Icon />
            {triggerText ?? "Invite"}
        </Button> 
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={UserPlusIcon}
          title={'Invite Collaborator'}
        />
        <div className="p-6">
          <Form {...form}>
            <form 
              className='space-y-8 w-full'
              onSubmit={form.handleSubmit(onSubmit)}
            >

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex gap-1 items-center'>
                      User Email
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field}/>
                    </FormControl>
                    <FormDescription>
                      Enter the Email of the user you want to invite.
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

export default InviteUsersDialog;