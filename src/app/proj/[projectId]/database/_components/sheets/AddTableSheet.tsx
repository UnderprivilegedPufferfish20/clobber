'use client'

import { ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Columns, Table2Icon, Link2Icon, EllipsisVerticalIcon, XIcon, MenuIcon } from 'lucide-react'
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import CustomDialogHeader from '@/components/CustomDialogHeader'
import { DATA_TYPES_LIST, FKEY_REFERENCED_ROW_ACTION_DELETED_LIST, FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST } from '@/lib/constants'
import { DATA_TYPE_TYPE, DATA_TYPES, FKEY_REFERENCED_ROW_ACTION_DELETED, FKEY_REFERENCED_ROW_ACTION_DELETED_TYPE, FKEY_REFERENCED_ROW_ACTION_UPDATED, FKEY_REFERENCED_ROW_ACTION_UPDATED_TYPE } from '@/lib/types'
import { Label } from '@/components/ui/label'
import z from 'zod'
import { createColumnSchema, createForeignKeySchema } from '@/lib/types/schemas'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { se } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { getSchemas } from '@/lib/actions/database/cache-actions'
import { getCols } from '@/lib/actions/database/columns/cache-actions'
import { addTable } from '@/lib/actions/database/tables'
import { getTables } from '@/lib/actions/database/tables/cache-actions'
import DataTypeSelect from '../DataTypeSelect'

function AddTableSheet({
  projectId,
  schema, // Ensure you pass the schema name (e.g., 'public')
  open,
  onOpenChange,
}: {
  projectId: string;
  schema: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {

  const emptyColumn: ColumnForm = {
    name: "",
    dtype: "integer",      // or DATA_TYPES.INT if that matches your enum
    isArray: false,
    default: undefined,
    isPkey: false,
    isUnique: false,
    isNullable: true,
  };



  type ColumnForm = z.infer<typeof createColumnSchema>;



  const [columns, setColumns] = useState<ColumnForm[]>([
    {
      name: "id",
      dtype: "uuid",
      isArray: false,
      isNullable: false,
      isPkey: true,
      isUnique: true,
      default: "uuid_generate_v4()",
    },
    {
      name: "$createdAt",
      dtype: "datetime",
      isArray: false,
      isNullable: false,
      isPkey: false,
      isUnique: false,
      default: "now()",
    },
    {
      name: "$updatedAt",
      dtype: "datetime",
      isArray: false,
      isNullable: false,
      isPkey: false,
      isUnique: false,
      default: "now()",
    }
  ])

  const [name, setName] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      addTable({
        name,
        columns
      }, projectId, schema),
    onSuccess: () => {
      toast.success("Column added successfully", { id: "add-column" });
      
      onOpenChange(false);
    },
    onMutate(variables, context) {
      toast.loading("Creating Column...", { id: "add-column" })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add column", { id: "add-column" });
    }
  })

  function updateColumn(idx: number, patch: Partial<ColumnForm>) {
    setColumns((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  function deleteColumn(idx: number) {
    setColumns((prev) => {
      const col = prev[idx];
      if (!col) return prev;

      return prev.filter((_, i) => i !== idx);
    });
  }

  const defaultSuggestions = (col: any) => {
    const t = col.dtype?.toLowerCase();
    if (t === "uuid") {
      return [
        {
          value: "uuid_generate_v4()",
          desc: "Generate a v4 UUID automatically for new rows.",
        },
      ];
    }
    if (t === "datetime" || t === "timestamp" || t === "timestamp with time zone") {
      return [
        {
          value: "now()",
          desc: "Set the value to the current timestamp on insert.",
        },
      ];
    }
    return [];
  };

  const getCheckedOptions = (col: any) => {
    return [col.isArray, col.isNullable, col.isUnique].filter(t => t === true).length
  }


  return (
    <>
    
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto p-0! z-100 focus:outline-none fullheight">
          <SheetHeader className="mb-4">
            <SheetTitle>Create Table</SheetTitle>
            <SheetDescription>
              Define the properties for your new PostgreSQL table.
            </SheetDescription>
          </SheetHeader>
          <Separator />

          <div className='space-y-6 p-6 flex-1'>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='table-name'>Name</Label>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                id='table-name'
              />
            </div>

            <div className="flex flex-col gap-6">
              <h1>Columns</h1>

              <div className="flex flex-col gap-1">
                <div className="fullwidth flex items-center pl-2 text-muted-foreground text-sm">
                  <h1 className="pr-25">Name</h1>
                  <h1 className="pr-32">Type</h1>
                  <h1 className="pr-16">Default Value</h1>
                  <h1>Primary Key</h1>
                </div>

                <div className='fullwidth flex flex-col gap-1'>
                  {columns.map((col, idx) => {

                    const showDefaultMenu = defaultSuggestions(col).length > 0;

                    return (
                        <div
                          key={`${col.name ?? "new"}:${idx}`}
                          className={`${col.isPkey && "bg-white/5"} flex items-center gap-2 fullwidth p-2 relative rounded-md border border-border`}
                        >
  
                          
  
                          <Input
                            value={col.name}
                            onChange={(e) => updateColumn(idx, { name: e.target.value })}
                            className="focus-visible:ring-0 focus-visible:ring-offset-0 max-w-32 min-w-32 w-32"
                          />
  
                          <DataTypeSelect
                            triggerClassname="max-w-35 min-w-35 w-35 truncate" 
                            value={col.dtype}
                            onValueChange={(v) => updateColumn(idx, { dtype: v as DATA_TYPE_TYPE, default: "" })}
                          />
  
                          <div className="relative w-full">
                            <Input
                              value={col.default ?? ""}
                              onChange={(e) => updateColumn(idx, { default: e.target.value })}
                              placeholder="NULL"
                              className={`truncate ${showDefaultMenu ? "pr-10" : ""} focus-visible:ring-0 focus-visible:ring-offset-0`}
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
  
                                    {defaultSuggestions(col).map((s) => (
                                      <DropdownMenuItem
                                        key={s.value}
                                        onSelect={(e) => e.preventDefault()}
                                        className="flex flex-col items-start gap-1"
                                        onClick={() => updateColumn(idx, { default: s.value })}
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
  
                          <Checkbox
                            className={`w-6 h-6 ${col.isPkey ? "mr-30" : "mr-18"}`}
                            checked={col.isPkey}
                            onCheckedChange={(v) => updateColumn(idx, { isPkey: Boolean(v), isArray: false })}
                          />
  
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className={`${col.isPkey && "hidden"} relative`} type="button">
                                {getCheckedOptions(col) > 0 && (
                                  <Badge className="absolute top-0 left-0 w-3 h-4">{getCheckedOptions(col)}</Badge>
                                )}
                                <EllipsisVerticalIcon className="w-6 h-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="z-140" align="end">
                              <DropdownMenuLabel>More Options</DropdownMenuLabel>
  
                              <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                                <Checkbox
                                  id={`isNullable-${idx}`}
                                  checked={col.isNullable}
                                  onCheckedChange={(v) => updateColumn(idx, { isNullable: Boolean(v) })}
                                />
                                <Label htmlFor={`isNullable-${idx}`}>Is Nullable</Label>
                              </DropdownMenuItem>
  
                              <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                                <Checkbox
                                  id={`isUnique-${idx}`}
                                  checked={col.isUnique}
                                  onCheckedChange={(v) => updateColumn(idx, { isUnique: Boolean(v) })}
                                />
                                <Label htmlFor={`isUnique-${idx}`}>Is Unique</Label>
                              </DropdownMenuItem>
  
                              {!col.isPkey && (
                                <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                                  <Checkbox
                                    id={`isArray-${idx}`}
                                    checked={col.isArray}
                                    onCheckedChange={(v) => updateColumn(idx, { isArray: Boolean(v) })}
                                  />
                                  <Label htmlFor={`isArray-${idx}`}>Is Array</Label>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
  
                          <Button variant="ghost" type="button" onClick={() => deleteColumn(idx)}>
                            <XIcon className="w-6 h-6" />
                          </Button>
                        </div>
                    )
                  })}
                </div>
                
                <div
                  className={`flex items-center justify-center fullwidth relative rounded-md border border-border py-2 mt-2`}
                >
                  <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setColumns((p) => [...p, emptyColumn])}>
                    Add Column
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <h1>Foreign Keys</h1> 
            </div>
          </div>

         <div className="bg-black w-full overflow-hidden flex items-center justify-end sticky bottom-0 border-t gap-2 p-3 pr-6 h-18 min-h-18 max-h-18">
            <SheetClose asChild>
              <Button variant={"secondary"}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={() => mutate()} variant={"default"}>
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Create Table
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default AddTableSheet;