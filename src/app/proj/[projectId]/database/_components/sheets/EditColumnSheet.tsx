"use client";

import { ColumnType, DATA_TYPE_TYPE } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import DataTypeSelect from "../DataTypeSelect";
import { Button } from "@/components/ui/button";
import { Loader2, MenuIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { defaultSuggestions } from "@/lib/utils";
import { editColumn } from "@/lib/actions/database/columns";
import DefaultValueSelector from "../DefaultValueSelector";

export default function EditColumnSheet({
  projectId,
  schema,
  table,
  column,
  open,
  onOpenChange
}: {
  projectId: string,
  schema: string,
  table: string,
  column: ColumnType,
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {

  const queryClient = useQueryClient()

  const [name, setName] = useState(column.name)
  const [dtype, setDtype] = useState<DATA_TYPE_TYPE>(column.dtype)

  const [isArray, setIsArray] = useState(column.isArray)
  const [isPkey, setIsPkey] = useState(column.isPkey)
  const [isUnique, setIsUnique] = useState(column.isUnique)
  const [isNullable, setIsNullable] = useState(column.isNullable)

  const [defaultValue, setDefaultValue] = useState(column.default)

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      editColumn(
        projectId, 
        schema, 
        table, 
        column, {
          dtype,
          isArray,
          isNullable,
          isPkey,
          isUnique,
          name,
          default: defaultValue
        }),
    onSuccess: () => {
      toast.success("Column updated successfully", { id: "updated-column" });
      
      onOpenChange(false);
      queryClient.invalidateQueries(['table-details', table] as any);
    },
    onMutate(variables, context) {
      toast.loading("Updating Column...", { id: "updated-column" })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update column", { id: "updated-column" });
    }
  })


  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  
  const isDirty = () => {
    return isArray !== column.isArray || isPkey !== column.isPkey || isNullable !== column.isNullable || isUnique !== column.isUnique || name !== column.name || dtype !== column.dtype
   }
  
  const handleOpenChange = (o: boolean) => {
    if (o) {
      onOpenChange(true);
      return;
    }

    if (!isDirty()) {
      onOpenChange(false);
      return;
    }

    setIsConfirmCloseOpen(true);
  };


  return (
    <>
    
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto z-100 fullheight flex-1 p-0!">
          <SheetHeader className="mb-4">
            
            <SheetTitle>Edit Column {column.name}</SheetTitle>
          </SheetHeader>
          <Separator />

          <div className='space-y-6 p-6 flex-1'>

            <div className='flex flex-col gap-2'>
              <h1>Name</h1>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='e.g. user_email'
                id='column-name'
              />
            </div>

            <Separator />

            <div className='flex flex-col gap-2'>
              <h1>Data Type</h1>
              <DataTypeSelect 
                onValueChange={v => setDtype(v as DATA_TYPE_TYPE)}
                value={dtype}
                triggerClassname=''
              />
            </div>

            <div className='flex flex-col gap-2'>
              <h1>Default Value</h1>
              <DefaultValueSelector 
                defaultValue={defaultValue ?? ""}
                setDefaultValue={setDefaultValue}
                dtype={dtype}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <h1>Constraints</h1>
              
              <div className='flex gap-2 items-center'>
                <Switch
                  defaultChecked={isPkey}
                  onClick={() => setIsPkey(p => !p)}
                /> 
                
                <p className={`text-xl text-white`}>Primary Key</p>
              </div>

              <div className='flex gap-2 items-center'>
                <Switch
                  defaultChecked={isNullable} 
                  disabled={isPkey}
                  onClick={() => setIsNullable(p => !p)} 
                /> 
                
                <p className={`${isPkey && "text-muted-foreground!"} text-xl text-white`}>Nullable</p>
              </div>

              <div className='flex gap-2 items-center'>
                <Switch 
                  disabled={isPkey}
                  defaultChecked={isUnique}
                  onClick={() => setIsUnique(p => !p)} 
                /> 
                
                <p className={`${isPkey && "text-muted-foreground!"} text-xl text-white`}>Unique</p>
              </div>

              <div className='flex gap-2 items-center'>
                <Switch 
                  disabled={isPkey}
                  defaultChecked={isArray}
                  onClick={() => setIsArray(p => !p)} 
                /> 
                
                <p className={`${isPkey && "text-muted-foreground!"} text-xl text-white`}>Array</p>
              </div>
            </div>
          </div>
          <div className="bg-black w-full overflow-hidden flex items-center justify-end sticky bottom-0 border-t gap-2 p-3 pr-6 h-18 min-h-18 max-h-18">
            <SheetClose asChild>
              <Button variant={"secondary"}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={() => mutate()} disabled={isPending || !name}>
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Create Column
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

              setName(column.name)
              setDefaultValue(column.default)
              setDtype(column.dtype)
              setIsUnique(column.isUnique)
              setIsArray(column.isArray)
              setIsPkey(column.isPkey)
              setIsNullable(column.isNullable)
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