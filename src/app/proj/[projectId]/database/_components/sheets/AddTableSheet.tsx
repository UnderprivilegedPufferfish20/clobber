'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EllipsisVerticalIcon, XIcon, Table2Icon, ArrowRightIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DATA_TYPES, FkeyType } from '@/lib/types'
import { Label } from '@/components/ui/label'
import z from 'zod'
import { createColumnSchema } from '@/lib/types/schemas'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { addTable } from '@/lib/actions/database/tables'
import DataTypeSelect from '../DataTypeSelect'
import DefaultValueSelector from '../DefaultValueSelector'
import AddFkeySheet from './AddFkeySheet'
import SheetWrapper from '@/components/SheetWrapper'

function AddTableSheet({
  projectId,
  schema, // Ensure you pass the schema name (e.g., 'public')
  open,
  onOpenChange,
}: {
  projectId: string;
  schema: string;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {

  const emptyColumn: ColumnForm = {
    name: "",
    dtype: DATA_TYPES.INTEGER,      // or DATA_TYPES.INT if that matches your enum
    isArray: false,
    default: undefined,
    isPkey: false,
    isUnique: false,
    isNullable: true,
  };



  type ColumnForm = z.infer<typeof createColumnSchema>;

  const defaultCols: ColumnForm[] = [
    {
      name: "id",
      dtype: DATA_TYPES.UUID,
      isArray: false,
      isNullable: false,
      isPkey: true,
      isUnique: true,
      default: "uuid_generate_v4()",
    },
    {
      name: "$createdAt",
      dtype: DATA_TYPES.TIMESTAMPTZ,
      isArray: false,
      isNullable: false,
      isPkey: false,
      isUnique: false,
      default: "now()",
    },
    {
      name: "$updatedAt",
      dtype: DATA_TYPES.TIMESTAMPTZ,
      isArray: false,
      isNullable: false,
      isPkey: false,
      isUnique: false,
      default: "now()",
    }
  ]


  const [columns, setColumns] = useState<ColumnForm[]>(defaultCols)

  const [fkeys, setFkeys] = useState<FkeyType[]>([])
  const [isFkeySheetOpen, setIsFkeySheetOpen] = useState(false)

  const [name, setName] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      addTable({
        name,
        columns
      }, projectId, schema),
    onSuccess: () => {
      toast.success("Table added successfully", { id: "add-table" });
      
      onOpenChange(false);
    },
    onMutate(variables, context) {
      toast.loading("Creating table...", { id: "add-table" })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add table", { id: "add-table" });
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

  const getCheckedOptions = (col: any) => {
    return [col.isArray, col.isNullable, col.isUnique].filter(t => t === true).length
  }


  const isDirty = () => {
    return JSON.stringify(columns) !== JSON.stringify(defaultCols) || name !== "" || JSON.stringify(fkeys) !== JSON.stringify([])
  }


  const getDefaultForType = (dtype: typeof DATA_TYPES[keyof typeof DATA_TYPES ]) => {
    switch (dtype) {
      case "uuid":
        return "uuid_generate_v4()";
      default:
        return "";
    }
  };

  


  return (
    <>
      <SheetWrapper
        disabled={columns.length === 0 || !name}
        onDiscard={() => {
          setName("")
          setColumns(defaultCols)
        }}
        onOpenChange={onOpenChange}
        onSubmit={() => mutate()}
        open={open}
        submitButtonText='Create Table'
        title='Create a table'
        description='PostgresSQL table'
        isPending={isPending}
        isDirty={isDirty}
      >
        <div className='flex flex-col gap-2'>
          <h1>Name</h1>
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

                const updateDefault = (value: string) => {
                  updateColumn(idx, { default: value });
                };

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
                        onValueChange={(v) => updateColumn(idx, { dtype: v as typeof DATA_TYPES[keyof typeof DATA_TYPES ], default: getDefaultForType(v as typeof DATA_TYPES[keyof typeof DATA_TYPES ]) })}
                      />
                      
                      <DefaultValueSelector 
                        defaultValue={col.default ?? ""}
                        dtype={col.dtype}
                        setDefaultValue={updateDefault}
                        className='truncate focus-visible:ring-0 focus-visible:ring-offset-0'
                      />

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
              className={`flex items-center justify-center fullwidth relative rounded-md border-dashed border border-border py-2 mt-2`}
            >
              <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setColumns((p) => [...p, emptyColumn])}>
                Add Column
              </Button>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <h1 className='mb-5'>Foreign Keys</h1>

          {fkeys.map((fkey, idx) => (
            <div
              key={idx}
              className={`flex flex-col fullwidth p-2 relative rounded-md border border-border`}
            >
              <div className='flex gap-1 items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Table2Icon className='w-4 h-4' />
                  <h2 className='text-md text-muted-foreground'>
                    {fkey.cols[0]!.referenceeSchema}.
                    <span className='text-white'>{fkey.cols[0]!.referenceeTable}</span>
                  </h2>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant={"outline"} 
                    onClick={() => setFkeys(p => p.splice(idx, 1))}
                  >
                    Delete
                  </Button>
                  <Button
                    variant={"outline"}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className='ml-6 flex w-fit flex-col gap-1 text-sm'>
                {fkey.cols.map(c => (
                  <div className='flex items-center justify-between p-1'>
                    <span className='text-muted-foreground'>{c.referencorColumn}</span>
                    <ArrowRightIcon className='w-4 h-4 mx-1' />
                    <span className='text-white'>{c.referenceeColumn}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
              className={`flex items-center justify-center fullwidth relative rounded-md border border-dashed border-border py-2 mt-2`}
            >
            <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setIsFkeySheetOpen(true)}>
              Add Foreign Key
            </Button>
          </div>
        </div>
        
      </SheetWrapper>

      <AddFkeySheet 
        projectId={projectId}
        setFkeys={setFkeys}
        table={{ name, columns }}
        open={isFkeySheetOpen}
        onOpenChange={setIsFkeySheetOpen}
        schema={schema}
      />

    </>
  )
}

export default AddTableSheet;