"use client";

import React, { Dispatch, SetStateAction, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog'
import { Loader2, LucideIcon } from 'lucide-react'
import CustomDialogHeader from './CustomDialogHeader'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

type Props = {
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  value: string,
  onValueChange: Dispatch<SetStateAction<string>>,
  headerIcon: LucideIcon,
  headerTitle: string,
  action: (...args: any[]) => any,
  actionArgs: any[]

  toastId: string,
  successMessage: string,
  loadingMessage: string,
  errorMessage: string
}

const TextInputDialog = (props: Props) => {

  const { mutate, isPending } = useMutation({
    mutationFn: () => props.action(...props.actionArgs),
    onSuccess: () => {
      toast.success(props.successMessage, { id: props.toastId });
      props.onOpenChange(false)
      props.onValueChange("")
    },
    onMutate(variables, context) {
      toast.loading(props.loadingMessage, { id: props.toastId })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success(props.successMessage, { id:props.toastId });
        props.onOpenChange(false);
        return;
      }
      toast.error(props.errorMessage, { id:props.toastId })
    }
  })

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          mutate()
        }}
      >
        <DialogContent>
          <CustomDialogHeader 
            icon={props.headerIcon}
            title={props.headerTitle}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="name" >Name</Label>
            <Input
              value={props.value}
              onKeyDown={e => {
              if (e.key === "Enter") {
                  e.preventDefault()
                  mutate()
                }
              }}
              onChange={e => props.onValueChange(e.target.value)} 
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

            <Button type='submit' disabled={isPending}>
              {!isPending && "Proceed"}
              {isPending && <Loader2 className='animate-spin' />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default TextInputDialog