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
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export default function DataTypeSelect({
  value,
  onValueChange,
  triggerClassname,
}: {
  value: string,
  onValueChange: (value: string) => void;
  triggerClassname: string,
}) {

  const [open, setOpen] = useState(false)

  const selectedType = DTypes.find(d => d.dtype === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", triggerClassname)}
        >
          {selectedType ? (
            <div className="flex items-center gap-2">
              <selectedType.icon />
              <span>{selectedType.dtype}</span>
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
            <CommandGroup>
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
                        value === t.dtype ? "opacity-100" : "opacity-0"
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
