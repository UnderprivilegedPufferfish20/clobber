'use client'

import { ReactNode, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Columns } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

  const [fkey, setFkey] = useState<{ 
    keySchema: string, 
    keyTable: string, 
    keyColumn: string, 
    updateAction: (typeof FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST)[number];
    deleteAction: (typeof FKEY_REFERENCED_ROW_ACTION_DELETED_LIST)[number];
  }>({ keySchema: "", keyTable: "", keyColumn: "", updateAction: "NO ACTION", deleteAction: "NO ACTION" })

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
        fkey
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

  const { data: schemas, isPending: isSchemasPending } = useQuery({
    queryKey: ["schemas", projectId],
    queryFn: () => getSchemas(projectId)
  })

  const { data: tables, isPending: isTablesPending } = useQuery({
    queryKey: ["tables", projectId, fkey.keySchema],
    queryFn: () => getTables(fkey.keySchema, projectId),
    enabled: fkey.keySchema !== ""
  })

  const { data: cols, isPending: isColsPending } = useQuery({
    queryKey: ["cols", projectId, fkey.keySchema, fkey.keyTable],
    queryFn: () => getCols(fkey.keySchema, projectId, fkey.keyTable),
    enabled: Boolean(fkey.keySchema !== "" && fkey.keyTable !== "")
  })

  const effectiveDtype = isArray ? `${dtype}[]` : dtype;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-2 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader 
            icon={Columns}
            title="Add New Column"
          />
          <SheetDescription>
            Define the properties for your new PostgreSQL column.
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-6'>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='column-name'>Column Name</Label>
            <Input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. user_email'
              id='column-name'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='data-type'>Data Type</Label>
            <Select onValueChange={v => setDtype(v as DATA_TYPE_TYPE)} defaultValue={dtype}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent className="z-110">
                {DATA_TYPES_LIST.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='default-value'>Default Value (optional)</Label>
            <Input 
              value={defaultValue}
              onChange={e => setDefaultValue(e.target.value)}
              placeholder="e.g. 'anonymous' or 0"
              id='default-value'
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Column Constraints</Label>
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
              <div className='flex items-center gap-4'>
                <Checkbox checked={isNullable} onCheckedChange={checked => setIsNullable(checked as boolean)} id="isNullable" />
                <Label className="font-normal cursor-pointer" htmlFor='isNullable'>Nullable</Label>
              </div>
              <div className='flex items-center gap-4'>
                <Checkbox checked={isPkey} onCheckedChange={checked => setIsPkey(checked as boolean)} id="isPkey" />
                <Label className="font-normal cursor-pointer" htmlFor='isPkey'>Primary Key</Label>
              </div>
              <div className='flex items-center gap-4'>
                <Checkbox checked={isUnique} onCheckedChange={checked => setIsUnique(checked as boolean)} id="isUnique" />
                <Label className="font-normal cursor-pointer" htmlFor='isUnique'>Unique</Label>
              </div>
              <div className='flex items-center gap-4'>
                <Checkbox checked={isArray} onCheckedChange={checked => setIsArray(checked as boolean)} id="isArray" />
                <Label className="font-normal cursor-pointer" htmlFor='isArray'>Array</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Foreign Key Constraint (optional)</Label>
            <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
              <div className='flex flex-col gap-2'>
                <Label>Referenced Schema</Label>
                <Select value={fkey.keySchema} onValueChange={v => setFkey(prev => ({ ...prev, keySchema: v, keyTable: "", keyColumn: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a schema" />
                  </SelectTrigger>
                  <SelectContent className="z-110">
                    {isSchemasPending ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                      </div>
                    ) : (
                      schemas?.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {fkey.keySchema !== "" && (
                <div className='flex flex-col gap-2'>
                  <Label>Referenced Table</Label>
                  <Select value={fkey.keyTable} onValueChange={v => setFkey(prev => ({ ...prev, keyTable: v, keyColumn: "" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent className="z-110">
                      {isTablesPending ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="animate-spin h-4 w-4" />
                        </div>
                      ) : (
                        tables?.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {fkey.keyTable !== "" && (
                <div className='flex flex-col gap-2'>
                  <Label>Referenced Column</Label>
                  <Select value={fkey.keyColumn} onValueChange={v => setFkey(prev => ({ ...prev, keyColumn: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent className="z-110">
                      {isColsPending ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="animate-spin h-4 w-4" />
                        </div>
                      ) : (
                        cols?.filter(c => c.dtype === effectiveDtype).map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {fkey.keyColumn !== "" && (
                <div className="space-y-4">
                  <div className='flex flex-col gap-2'>
                    <Label>Action if Referenced Row is Updated</Label>
                    <Select value={fkey.updateAction} onValueChange={v => setFkey(prev => ({ ...prev, updateAction: v as FKEY_REFERENCED_ROW_ACTION_UPDATED }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                      <SelectContent className="z-110">
                        {FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label>Action if Referenced Row is Deleted</Label>
                    <Select value={fkey.deleteAction} onValueChange={v => setFkey(prev => ({ ...prev, deleteAction: v as FKEY_REFERENCED_ROW_ACTION_DELETED }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                      <SelectContent className="z-110">
                        {FKEY_REFERENCED_ROW_ACTION_DELETED_LIST.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button onClick={() => mutate()} className="w-full" disabled={isPending || !name}>
            {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
            Create Column
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AddColumnSheet;