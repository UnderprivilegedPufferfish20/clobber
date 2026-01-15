"use client";

import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

const SheetWrapper = ({ 
  children,
  open,
  onOpenChange,
  title,
  description,
  isDirty,
  sheetContentClassname,
  bodyClassname,
  disabled,
  onSubmit,
  submitButtonText,
  isPending,
  onDiscard
}: { 
  children: ReactNode,
  open: boolean, 
  onOpenChange: Dispatch<SetStateAction<boolean>>

  disabled: boolean,
  onSubmit: () => void;
  onDiscard?: () => void;
  submitButtonText: string,
  isPending?: boolean,


  title: string, 
  description?: string,

  isDirty?: () => boolean;

  sheetContentClassname?: string
  bodyClassname?: string

 }) => {

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  const handleOpenChange = (o: boolean) => {
    if (o) {
      onOpenChange(true);
      return;
    }

    if (isDirty && isDirty() === false) {
      onOpenChange(false);
      return;
    }

    setIsConfirmCloseOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className={cn("sm:max-w-2xl overflow-y-auto p-0! z-100 focus:outline-none fullheight", sheetContentClassname)}>
          <SheetHeader className="mb-4">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <Separator />

          <div className={cn('space-y-6 p-6 flex-1', bodyClassname)}>
            {children}
          </div>

          <div className="bg-black w-full overflow-hidden flex items-center justify-end sticky bottom-0 border-t gap-2 p-3 pr-6 h-18 min-h-18 max-h-18">
            <SheetClose asChild>
              <Button variant={"secondary"}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={onSubmit} variant={"default"} disabled={disabled}>
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              {submitButtonText}
            </Button>
          </div>
        </SheetContent>
      </Sheet>


      <AlertDialog
        open={isConfirmCloseOpen}
        onOpenChange={setIsConfirmCloseOpen}
      >
        <AlertDialogContent className="z-160">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setIsConfirmCloseOpen(false);
            }}
          >
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setIsConfirmCloseOpen(false);
              onOpenChange(false);

              if (onDiscard) { onDiscard() }
            }}
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SheetWrapper