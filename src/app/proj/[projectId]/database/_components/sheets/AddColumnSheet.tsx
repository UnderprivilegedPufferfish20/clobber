'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator'
import { addColumn } from '@/lib/actions/database/columns'
import DataTypeSelect from '../DataTypeSelect'
import { Switch } from '@/components/ui/switch'
import DefaultValueSelector from '../selectors/DefaultValueSelector'
import { DATA_TYPES } from '@/lib/types'
import SheetWrapper from '@/components/SheetWrapper'

function AddColumnSheet({
  projectId,
  tableId,
  schema, // Ensure you pass the schema name (e.g., 'public')
  open,
  onOpenChange,
}: {
  tableId: string;
  projectId: string;
  schema: string;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [dtype, setDtype] = useState<typeof DATA_TYPES[keyof typeof DATA_TYPES]>("boolean")

  const [isArray, setIsArray] = useState(false)
  const [isPkey, setIsPkey] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [isNullable, setIsNullable] = useState(true)

  const [defaultValue, setDefaultValue] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      addColumn({
        dtype,
        isArray,
        isNullable,
        isPkey,
        isUnique,
        name,
        default: defaultValue,
      }, schema, projectId, tableId),
    onSuccess: () => {
      toast.success("Column added successfully", { id: "add-column" });
      
      onOpenChange(false);
      queryClient.invalidateQueries(['table-details', tableId] as any);
    },
    onMutate(variables, context) {
      toast.loading("Creating Column...", { id: "add-column" })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add column", { id: "add-column" });
    }
  })



  return (
    <>

    <SheetWrapper
      title='Add Column'
      description='New dimension of data to the table'
      disabled={isPending || !name}
      submitButtonText='Create Column'
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={() => mutate()}
      isPending={isPending}

    >
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
          onValueChange={v => setDtype(v as typeof DATA_TYPES[keyof typeof DATA_TYPES])}
          value={dtype}
          triggerClassname=''
        />
      </div>

      <div className='flex flex-col gap-2'>
        <h1>Default Value</h1>
        <DefaultValueSelector 
          defaultValue={defaultValue}
          setDefaultValue={setDefaultValue}
          dtype={dtype}
        />
      </div>


      <Separator />

      <div className="space-y-2">
        <h1>Constraints</h1>
        
        <div className='flex gap-2 items-center'>
          <Switch
            onClick={() => setIsPkey(p => !p)}
          /> 
          
          <p className={`text-xl text-white`}>Primary Key</p>
        </div>

        <div className='flex gap-2 items-center'>
          <Switch 
            disabled={isPkey}
            onClick={() => setIsNullable(p => !p)} 
          /> 
          
          <p className={`${isPkey && "text-muted-foreground!"} text-xl text-white`}>Nullable</p>
        </div>

        <div className='flex gap-2 items-center'>
          <Switch 
            disabled={isPkey}
            onClick={() => setIsUnique(p => !p)} 
          /> 
          
          <p className={`${isPkey && "text-muted-foreground!"} text-xl text-white`}>Unique</p>
        </div>

        <div className='flex gap-2 items-center'>
          <Switch 
            disabled={isPkey}
            onClick={() => setIsArray(p => !p)} 
          /> 
          
          <p className={`${isPkey && "text-muted-foreground!"} text-xl text-white`}>Array</p>
        </div>
      </div>
    </SheetWrapper>
    

    </>
  )
}

export default AddColumnSheet;