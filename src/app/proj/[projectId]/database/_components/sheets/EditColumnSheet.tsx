"use client";

import { ColumnType, DATA_TYPES } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import DataTypeSelect from "../DataTypeSelect";
import { Switch } from "@/components/ui/switch";
import { editColumn } from "@/lib/actions/database/columns";
import DefaultValueSelector from "../selectors/DefaultValueSelector";
import SheetWrapper from "@/components/SheetWrapper";

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
  const [dtype, setDtype] = useState<typeof DATA_TYPES[keyof typeof DATA_TYPES]>(column.dtype)

  const [isArray, setIsArray] = useState(column.is_array)
  const [isPkey, setIsPkey] = useState(column.is_pkey)
  const [isUnique, setIsUnique] = useState(column.is_unique)
  const [isNullable, setIsNullable] = useState(column.is_nullable)

  const [defaultValue, setDefaultValue] = useState(column.default)

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      editColumn(
        projectId, 
        schema, 
        table, 
        column, {
          dtype,
          is_array: isArray,
          is_nullable: isNullable,
          is_pkey: isPkey,
          is_unique: isUnique,
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

  
  const isDirty = () => {
    return isArray !== column.is_array || isPkey !== column.is_pkey || isNullable !== column.is_nullable || isUnique !== column.is_unique || name !== column.name || dtype !== column.dtype
   }
  

  return (
    <>
      <SheetWrapper
        disabled={isPending || !name}
        onOpenChange={onOpenChange}
        open={open}
        onSubmit={() => mutate()}
        submitButtonText="Apply Changes"
        title={`Edit ${column.name}`}
        description={`Change properties of ${column.name}`}
        onDiscard={() => {
          setName(column.name)
          setDefaultValue(column.default)
          setDtype(column.dtype)
          setIsUnique(column.is_unique)
          setIsArray(column.is_array)
          setIsPkey(column.is_pkey)
          setIsNullable(column.is_nullable)
        }}
        isPending={isPending}
        isDirty={isDirty}
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
            defaultValue={defaultValue ?? ""}
            setDefaultValue={setDefaultValue}
            dtype={dtype}
            isArray={isArray}
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
      </SheetWrapper>
    </>
  )
}