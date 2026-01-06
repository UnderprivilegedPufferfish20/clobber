"use client";

import CustomDialogHeader from '@/components/CustomDialogHeader'
import { DialogFooter, Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FolderPlusIcon, Loader2 } from 'lucide-react'
import React, { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createFolder } from '@/lib/actions/storage/files/folder';

type Props = {
  projectId: string,
  createFolderOpen: boolean,
  setCreateFolderOpen: Dispatch<SetStateAction<boolean>>,
  newFolderName: string,
  setNewFolderName: Dispatch<SetStateAction<string>>,
  path: string
}

const CreateFolderDialog = (props: Props) => {

  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => createFolder(props.projectId, props.newFolderName, props.path),
    onSuccess: async () => {
      toast.success("Folder Created", { id:"create-folder" });
      props.setCreateFolderOpen(false);
      props.setNewFolderName("")
      await qc.invalidateQueries(["folder-data", `${props.projectId}/${props.path}`] as any)
    },
    onError: async (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("folder Added", { id:"create-folder" });
        props.setCreateFolderOpen(false);
        await qc.invalidateQueries(["folder-data", `${props.projectId}/${props.path}`] as any)
        return;
      }
      toast.error("Failed to Create folder", { id:"create-folder" })
    }
  })


  return (
    <Dialog
        open={props.createFolderOpen}
        onOpenChange={props.setCreateFolderOpen}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            mutate()
          }}
        >
          <DialogContent>
            <CustomDialogHeader 
              icon={FolderPlusIcon}
              title="New Folder"
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" >Name</Label>
              <Input
                value={props.newFolderName}
                onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    mutate()
                  }
                }}
                onChange={e => props.setNewFolderName(e.target.value)} 
                id="name"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={'outline'}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button type='submit' disabled={isPending || props.newFolderName === ""}>
                {!isPending && "Proceed"}
                {isPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
  )
}

export default CreateFolderDialog