'use client'

import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Columns, ChevronsUpDown, ArrowRightIcon, XIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetClose,
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
import { addColumn } from '@/lib/actions/database/actions'
import CustomDialogHeader from '@/components/CustomDialogHeader'
import { DATA_TYPES_LIST, FKEY_REFERENCED_ROW_ACTION_DELETED_LIST, FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST } from '@/lib/constants'
import { DATA_TYPE_TYPE, FKEY_REFERENCED_ROW_ACTION_DELETED, FKEY_REFERENCED_ROW_ACTION_DELETED_TYPE, FKEY_REFERENCED_ROW_ACTION_UPDATED, FKEY_REFERENCED_ROW_ACTION_UPDATED_TYPE, SELECTED_FKEY_COLS_TYPE } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getCols, getTables } from '@/lib/actions/database/getActions'
import { createForeignKeySchema } from '@/lib/types/schemas'
import z from 'zod'

function AddForeignKeySheet({
  projectId,
  tableId,
  schema, // Ensure you pass the schema name (e.g., 'public')
  schemas,
  open,
  onOpenChange,
  fkeys,
  setFkeys
}: {
  tableId: string;
  projectId: string;
  schema: string;
  schemas: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fkeys: z.infer<typeof createForeignKeySchema[]>
  setFkeys: Dispatch<SetStateAction<z.infer<typeof createForeignKeySchema[]>>>
}) {
  const queryClient = useQueryClient()

  const [selectedSchema, setSelectedSchema] = useState("")
  const [selectedTable, setSelectedTable] = useState("")

  const referencorColumnsQuery = useQuery({
    queryKey: ["cols", projectId, schema, tableId],
    queryFn: async () => getCols(schema, projectId, tableId)
  })

  const tablesQuery = useQuery({
    queryKey: ["tables", projectId, selectedSchema],
    queryFn: async () => getTables(selectedSchema, projectId),
    enabled: Boolean(projectId && selectedSchema),
    staleTime: 30_000,
  });

  const columnsQuery = useQuery({
    queryKey: ["cols", projectId, selectedSchema, tablesQuery.data],
    queryFn: async () => getCols(selectedSchema, projectId, selectedTable),
    enabled: Boolean(projectId && selectedSchema && selectedTable),
    staleTime: 30_000,
  });


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-2 z-100">
        <SheetHeader className="mb-4">
          Add foreign key relationship to {tableId}
        </SheetHeader>

        <div className='space-y-6'>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='column-name'>Select a Schema</Label>
            
            <Select value={selectedSchema} onValueChange={v => setSelectedSchema(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a schema" />
              </SelectTrigger>
              <SelectContent className="z-110">
                {schemas.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='data-type'>Select a table to reference to</Label>
            <Select value={selectedTable} onValueChange={v => setSelectedTable(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent className="z-110">
                {tablesQuery && tablesQuery.data && tablesQuery.data.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <h1>Select the columns from {selectedTable} to reference to</h1>

            <div className='flex items-center justify-between text-muted-foreground'>
              {tableId}
              {selectedTable}
            </div>

            <div className='flex flex-col gap-2'>
              {fkey.cols.map((fk, idx) => {

                return (
                  <div className='flex items-center justify-between'>
                    <Select value={fk.referencorColumn} onValueChange={v => fk.referencorColumn = v}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent className="z-110">
                        {referencorColumnsQuery && referencorColumnsQuery.data && referencorColumnsQuery.data.map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <ArrowRightIcon className='h-12 w-12' />

                    <Select value={fk.referenceeColumn} onValueChange={v => fk.referenceeColumn = v}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent className="z-110">
                        {columnsQuery && columnsQuery.data && columnsQuery.data.map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant={"ghost"}
                      onClick={() => fkey.cols.splice(idx, 1)}
                    >
                      <XIcon className='w-10 h-10'/>
                    </Button>
                  </div>
                )
              })}
            </div>

            <Button
              variant={"secondary"}
              onClick={() => fkey.cols.push({ referencorSchema: schema, referencorTable: tableId, referencorColumn: "", referenceeColumn: "", referenceeSchema: selectedSchema, referenceeTable: selectedTable })}
            >
              Add another column
            </Button>
          </div>

          <div className='flex flex-col gap-2'>
            <h1>Action if referenced row is updated</h1>

            <Select value={fkey.updateAction} onValueChange={v => fkey.updateAction = v as FKEY_REFERENCED_ROW_ACTION_UPDATED}>
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
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
            <h1>Action if referenced row is deleted</h1>

            <Select value={fkey.deleteAction} onValueChange={v => fkey.deleteAction = v as FKEY_REFERENCED_ROW_ACTION_DELETED}>
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
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

          

          <SheetClose className='bg-indigo-500'>
            Save
          </SheetClose>
          <SheetClose>
            Cancel
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AddForeignKeySheet;
