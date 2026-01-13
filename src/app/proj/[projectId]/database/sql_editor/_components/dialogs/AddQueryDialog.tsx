'use client'

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FilePlus2Icon, FileSpreadsheet, FolderIcon, Loader2, PlusIcon, Table2 } from 'lucide-react';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
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
import { sql, SqlFolder } from '@/lib/db/generated';
import { createQuery } from '@/lib/actions/database/sql';

const AddQueryDialog = ({ 
  projectId, open, onOpenChange, hideTrigger, folders
}: {
  projectId: string, open: boolean; onOpenChange: any, hideTrigger: any, folders: SqlFolder[]
}) => {
  const queryClient = useQueryClient()

  const [folderId, setFolderId] = useState<string>("root")


  const form = useForm<z.infer<typeof createQuerySchema>>({
    resolver: zodResolver(createQuerySchema),
    defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: z.infer<typeof createQuerySchema>) => 
      createQuery(form, projectId, folderId === 'root' ? "" : folderId),
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
  query,
  folders,
  folderId,
  setFolderId,
}: {
  query?: sql;
  folders: SqlFolder[];
  folderId: string;
  setFolderId: Dispatch<SetStateAction<string>>;
}) {
  const options = useMemo(() => {
    const root: Pick<SqlFolder, "id" | "name"> = {
      id: "root",
      name: "No folder (Root of Editor)",
    };

    const filtered = folders.filter((f) => f.id !== "root");

    // Optional: de-dupe by id just in case
    const seen = new Set<string>();
    const deduped = filtered.filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });

    return [root, ...deduped];
  }, [folders]);

  // The "current folder" for an existing query (normalized to "root")
  const currentFolderId = query?.folderId ? query.folderId : "root";

  // ✅ Set default folderId:
  // - if query exists: default to its current folder (or root)
  // - else: default to root
  useEffect(() => {
    // If folderId isn't set yet, initialize it appropriately
    if (!folderId) {
      setFolderId(query ? currentFolderId : "root");
      return;
    }

    // If folderId is set but isn't a valid option anymore, fall back
    const isValid = options.some((o) => o.id === folderId);
    if (!isValid) {
      setFolderId(query ? currentFolderId : "root");
    }
  }, [folderId, setFolderId, query, currentFolderId, options]);

  return (
    <Select value={folderId} onValueChange={setFolderId}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a folder..." />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Folders</SelectLabel>

          {options.map((f) => {
            const isCurrent = !!query && currentFolderId === f.id;

            return (
              <SelectItem
                key={f.id}
                value={f.id}
                className="flex gap-2 items-center"
              >
                <FolderIcon className="h-4 w-4" />
                <span>
                  {f.name}
                  {isCurrent ? " (Current)" : ""}
                </span>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


