'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Columns, MenuIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CustomDialogHeader from '@/components/CustomDialogHeader'
import { DATA_TYPES_LIST, FKEY_REFERENCED_ROW_ACTION_DELETED_LIST, FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST } from '@/lib/constants'
import { DATA_TYPE_TYPE, FKEY_REFERENCED_ROW_ACTION_DELETED, FKEY_REFERENCED_ROW_ACTION_DELETED_TYPE, FKEY_REFERENCED_ROW_ACTION_UPDATED, FKEY_REFERENCED_ROW_ACTION_UPDATED_TYPE } from '@/lib/types'
import { Label } from '@/components/ui/label'
import z from 'zod'
import { createForeignKeySchema } from '@/lib/types/schemas'
import { Separator } from '@/components/ui/separator'
import { getSchemas } from '@/lib/actions/database/cache-actions'
import { addColumn } from '@/lib/actions/database/columns'
import { getCols } from '@/lib/actions/database/columns/cache-actions'
import { getTables } from '@/lib/actions/database/tables/cache-actions'
import DataTypeSelect from '../DataTypeSelect'
import { Switch } from '@/components/ui/switch'
import { defaultSuggestions } from '@/lib/utils'

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
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [dtype, setDtype] = useState<DATA_TYPE_TYPE>("string")

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


  const handleOpenChange = (o: boolean) => {
    if (o) {
      onOpenChange(true);
      return;
    }

    setIsConfirmCloseOpen(true);
  };


  
  useEffect(() => {
    switch (dtype) {
      case "uuid":
        setDefaultValue("uuid_generate_v4()");
        break
      case "datetime":
        setDefaultValue("now()");
        break
      default:
        setDefaultValue("")
    }
  }, [dtype])

  const showDefaultMenu = dtype === "datetime" || dtype === "uuid"
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  return (
    <>
    
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto z-100 fullheight flex-1 p-0!">
          <SheetHeader className="mb-4">
            
            <SheetTitle>Add Column to {tableId}</SheetTitle>
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

              <div className='relative w-full'>
                <Input 
                  value={defaultValue}
                  onChange={e => setDefaultValue(e.target.value)}
                  placeholder="e.g. 'anonymous' or 0"
                  id='default-value'
                />

                {showDefaultMenu && (
                  <div className="absolute inset-y-0 right-1 flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Default value suggestions"
                        >
                          <MenuIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-72 z-110">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Suggested defaults
                        </DropdownMenuLabel>

                        {defaultSuggestions(dtype).map((s) => (
                          <DropdownMenuItem
                            key={s.value}
                            className="flex flex-col items-start gap-1"
                            onClick={() => setDefaultValue(s.value)}
                          >
                            <div className="font-mono text-sm">{s.value}</div>
                            <div className="text-xs text-muted-foreground">{s.desc}</div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
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

              setName("")
              setDefaultValue("")
              setDtype("string")
              setIsUnique(false)
              setIsArray(false)
              setIsPkey(false)
              setIsNullable(false)
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

export default AddColumnSheet;