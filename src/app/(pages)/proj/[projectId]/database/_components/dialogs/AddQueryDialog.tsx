'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FilePlus2Icon, FileSpreadsheet, FolderIcon, Loader2, PlusIcon, Table2 } from 'lucide-react';
import { Dispatch, SetStateAction, useCallback, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { createQuerySchema } from '@/lib/types/schemas';
import { addTable, createQuery } from '@/lib/actions/database/actions';
import { SqlFolder } from '@/lib/db/generated';

const AddQueryDialog = ({ 
  projectId, open, onOpenChange, hideTrigger, folders
}: {
  projectId: string, open: boolean; onOpenChange: any, hideTrigger: any, folders: SqlFolder[]
}) => {
  const queryClient = useQueryClient()

  const [folderId, setFolderId] = useState<string>("")


  const form = useForm<z.infer<typeof createQuerySchema>>({
    resolver: zodResolver(createQuerySchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createQuerySchema>) => 
      createQuery(form, projectId, folderId),
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
    (values: z.infer<typeof createQuerySchema>) => {
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
            <FilePlus2Icon />
            <p>Create Query</p>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='px-0'>
        <CustomDialogHeader 
          icon={FileSpreadsheet}
          title={'Create Query'}
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
                      Query Name
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field}/>
                    </FormControl>
                    <FormDescription>
                      Enter the name of the new query.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className='flex gap-1 items-center'>
                  Folder
                </FormLabel>  
                <FolderSelect folders={folders} folderId={folderId} setFolderId={setFolderId} />
                <FormDescription>
                  Select a folder to put it into
                </FormDescription>
                <FormMessage />
              </FormItem>

              
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

export default AddQueryDialog;




export function FolderSelect({
  folders,
  folderId,
  setFolderId,
}: {
  folders: SqlFolder[];
  folderId: string;
  setFolderId: Dispatch<SetStateAction<string>>;
}) {
  return (
    <Select value={folderId} onValueChange={setFolderId}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a folder..." />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Folders</SelectLabel>

          {folders.map((f) => (
            <SelectItem key={f.id} value={f.id} className="flex gap-2 items-center">
              <FolderIcon className="h-4 w-4" />
              {f.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
