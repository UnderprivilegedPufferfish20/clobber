"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DatabaseObjectAddSheetProps } from '@/lib/types';
import React from 'react'

const AddRoleSheet = ({
  onOpenChange,
  open,
  projectId,
  schemas
}: DatabaseObjectAddSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-0! z-100 focus:outline-none fullheight">
        <SheetHeader className="mb-4">
          <SheetTitle>Create role</SheetTitle>
          <SheetDescription>Enhances data protection and system security</SheetDescription>
        </SheetHeader>

        <div className='space-y-6 p-6 flex-1'>
          
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AddRoleSheet