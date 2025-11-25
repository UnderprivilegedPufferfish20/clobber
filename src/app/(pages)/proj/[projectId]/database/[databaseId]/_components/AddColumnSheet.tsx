'use client';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { dtypes } from "@/lib/constants/dtypes";
import { Separator } from "../../../../../../../components/ui/separator";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTableById } from "@/lib/actions/tables/getTableById";
import { toast } from "sonner";

export function AddColumnSheet({
  trigger
}: {
  trigger: React.ReactNode
}) {

  const sp = useSearchParams()

  if (!sp.get('table')) throw new Error("No table found")

  const [name, setName] = React.useState<string>('')
  const [defaultValue, setDefaultValue] = React.useState<string>('')
  const [isOptional, setIsOptional] = React.useState<boolean>(false)
  const [dtype, setDType] = React.useState("")
  const [isArray, setIsArray] = React.useState<boolean>(false)
  const [isPKey, setIsPKey] = React.useState<boolean>(false)
  const [isUnique, setIsUnique] = React.useState<boolean>(false)

  const { data } = useQuery({
    queryKey: ['sheetGetTable'],
    queryFn: () => getTableById(sp.get('table')!)
  })

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="min-w-3xl">
        <SheetHeader>
          <SheetTitle>Add Column</SheetTitle>
          <SheetDescription>
            Tack on another column to the table
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex flex-col gap-6 px-4">
          <div className="flex flex-col gap-2">
            <h1>Name</h1>
            <Input placeholder="Enter name of column" value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div className="w-full flex justify-between items-center my-5">
            <div className="flex flex-col gap-2">
              <h1>Data Type</h1>
              <Combobox 
                value={dtype}
                setValue={setDType}
              />
            </div>

            <div className="flex flex-col gap-2">
              <h1>Default Value</h1>
              <Input placeholder="NULL" value={defaultValue} onChange={e => setDefaultValue(e.target.value)}/>
            </div>
            

            <div className="flex flex-col gap-2">
              <h1>Optional</h1>
              <Input type="checkbox" disabled={isPKey} className="w-5xs" onChange={() => setIsOptional(p => !p)} />
            </div>

            <div className="flex flex-col gap-2">
              <h1>Array</h1>
              <Input type="checkbox" disabled={isPKey} onChange={() => setIsArray(p => !p)} />
            </div>
          </div>

          <Separator />

          <div className="w-full flex items-center justify-evenly">
            <div className="flex flex-col gap-2">
              <h1>Is Primary Key</h1>
              <Input type="checkbox" onChange={() => setIsPKey(p => !p)} />
            </div>

            <div className="flex flex-col gap-2">
              <h1>Is Unique</h1>
              <Input type="checkbox" disabled={isPKey} onChange={() => setIsUnique(p => !p)} />
            </div>

          </div>



          
        </div>

        <SheetFooter>
          <Button type="submit" onClick={() => {
            if (data && JSON.parse(data.data) != null && !defaultValue) {
              toast.error('Since this table is not empty, you must provide a default value')
            }
          }} disabled={!name || !dtype || !data} >Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}




export function Combobox({ value, setValue }: { value: string, setValue: React.Dispatch<React.SetStateAction<string>> }) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-xs"
        >
          {value
            ? dtypes.find((framework) => framework.name === value)?.name
            : "Select Data Type..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search Data Type..." className="h-9" />
          <CommandList>
            <CommandEmpty>No data type found.</CommandEmpty>
            <CommandGroup>
              {dtypes.map((dt) => (
                <CommandItem
                  key={dt.name}
                  value={dt.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {dt.icon}
                    {dt.name}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === dt.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

