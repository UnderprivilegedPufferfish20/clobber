"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DATA_TYPES_LIST } from "@/lib/constants";
import { defaultSuggestions } from "@/lib/utils";
import { MenuIcon } from "lucide-react";
import { useEffect } from "react";

type Props = {
  defaultValue: string
  setDefaultValue: (value: string) => void
  dtype: (typeof DATA_TYPES_LIST)[number]
  className?: string
}

export default function DefaultValueSelector({
  defaultValue,
  setDefaultValue,
  dtype,
  className
}: Props) {
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

  const showDefaultMenu = dtype === "datetime" || dtype === "uuid" || dtype === "boolean"

  return (

      <div className='relative w-full'>
        <Input
          className={className} 
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
  )
}