"use client";

import { Button } from "@/components/ui/button";
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
import { DTypes } from "@/lib/constants";
import { DATA_TYPES, EnumType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, ListIcon, LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function DataTypeSelect({
  value,
  onValueChange,
  triggerClassname,
  disabled = false,
  enums
}: {
  value: EnumType | DATA_TYPES,
  onValueChange: (value: EnumType | DATA_TYPES) => void;
  triggerClassname: string,
  disabled?: boolean,
  enums: EnumType[]
}) {

  const [open, setOpen] = useState(false)

  const ValueIcon: LucideIcon = useMemo(() => {
    const pro = DTypes.find(d => d.dtype === value)

    if (pro) {
      return pro.icon 
    } else {
      return ListIcon
    }
  }, [value])

  const valueLabel: string = useMemo(() => {
    const pro = DTypes.find(d => d.dtype === value)

    if (pro) {
      return pro.dtype 
    } else {
      if (typeof value === "object") {
        return (value as EnumType).enum_name
      } else {
        return (value as string).split(".")[1].slice(1, -1)
      }

    }
  }, [value])

  useEffect(() => {
    console.log("@VALUE LABEL: ", valueLabel)
  }, [valueLabel])


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", triggerClassname)}
        >
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <ValueIcon />
              <span>{valueLabel}</span>
            </div>
          ) : (
            "Select data type..."
          )}
          <ChevronsUpDown className="ml-2 opacity-50 h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-xl p-0 z-150"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search data types..." />
          <CommandList>
            <CommandEmpty>No data type found.</CommandEmpty>
            <CommandGroup heading="Postgres Data Types">
              {DTypes.map((t) => (
                <CommandItem
                  key={t.dtype}
                  value={t.dtype}
                  onSelect={() => {
                    onValueChange(t.dtype)
                    setOpen(false)
                  }}
                  className="p-0"
                >
                  <div className="flex items-center justify-between p-2 text-xs w-full">
                    <div className="flex items-center gap-2">
                      <t.icon className="w-6 h-6" />
                      <div>
                        <h1 className="font-semibold">{t.dtype}</h1>
                        <p className="text-muted-foreground text-xs">{t.description}</p>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        valueLabel === t.dtype ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Enums">
              {enums.map(t => (
                <CommandItem
                  key={t.enum_name}
                  value={t.enum_name}
                  onSelect={() => {
                    onValueChange(t)
                    setOpen(false)
                  }}
                  className="p-0"
                >
                  <div className="flex items-center justify-between p-2 text-xs w-full">
                    <div className="flex items-center gap-2">
                      <ListIcon className="w-6 h-6" />
                      <h1 className="font-semibold">{t.enum_name}</h1>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        valueLabel === t.enum_name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
