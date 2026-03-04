"use client";

import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getSchemas } from "@/lib/actions/database/cache-actions";
import { getEnums } from "@/lib/actions/database/enums/cache-actions";
import { DATA_TYPES, EnumType } from "@/lib/types";
import { EnumTypeSchema } from "@/lib/types/schemas";
import { defaultSuggestions } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { MenuIcon } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef } from "react";

type Props = {
  defaultValue: string
  setDefaultValue: (value: string) => void
  dtype: DATA_TYPES | EnumType
  isArray: boolean,
  project_id: string,
  className?: string
}

export default function DefaultValueSelector({
  defaultValue,
  setDefaultValue,
  dtype,
  isArray,
  project_id,
  className
}: Props) {

  console.log("@DTYPE: ", dtype)

  const isEnum = useMemo(() => {
    const { success } = EnumTypeSchema.safeParse(dtype)
    return success || (dtype as string).split(".").length > 0
  }, [dtype])

  const suffix = isArray ? '[]' : '';
  const displayedValue = 
    defaultValue.startsWith("ARRAY[") 
      ? defaultValue.slice(6, -1) + suffix
      : defaultValue + suffix

  const inputRef = useRef<HTMLInputElement>(null);

  const { data: enumVals, isPending } = useQuery({
    queryKey: ["enum-vals", project_id, dtype],
    queryFn: async () => {
      const schemas = await getSchemas(project_id);

      const enums: EnumType[] = []

      await Promise.all(
        schemas.map(async s => {
          const es = await getEnums(project_id, s)
          enums.push(...es)
        })
      )

      if (typeof dtype === "object") {
        return enums.find(e => e.enum_name === (dtype as EnumType).enum_name)!.enum_values.split(", ")
      } else {
        return enums.find(e => e.enum_name === (dtype as string).split(".")[1].slice(1, -1))!.enum_values.split(", ")
      } 

    },
    enabled: isEnum
  })

  useEffect(() => {
    if (defaultValue !== "") return;

    if (!isEnum) {
      switch (dtype) {
        case "uuid":
          if (defaultValue === "") break;
          setDefaultValue("uuid_generate_v4()" as DATA_TYPES);
          break
        case "timestamp with time zone":
          if (defaultValue === "") break;
          setDefaultValue("now()" as DATA_TYPES);
          break
        case "boolean":
          if (defaultValue === "") break;
          setDefaultValue("" as DATA_TYPES)
          break
        default:
          if (defaultValue === "") break;
          setDefaultValue("" as DATA_TYPES)
      }
    } 

  }, [dtype])

  const showDefaultMenu = dtype === "timestamp with time zone" || dtype === "uuid" || dtype === "boolean" || isEnum

  const prClass = showDefaultMenu ? 'pr-10' : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const prefixLength = target.value.length - suffix.length;
    const { selectionStart, selectionEnd } = target;
    const isSelecting = selectionStart !== selectionEnd;

    if (e.key === 'Backspace' && selectionEnd && selectionStart) {
      if (isSelecting && selectionEnd && selectionStart) {
        if (selectionEnd > prefixLength) {
          e.preventDefault();
        }
      } else if (selectionStart > prefixLength) {
        e.preventDefault();
      }
    } else if (e.key === 'Delete' && selectionEnd && selectionStart) {
      if (isSelecting) {
        if (selectionEnd > prefixLength) {
          e.preventDefault();
        }
      } else if (selectionStart >= prefixLength) {
        e.preventDefault();
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && selectionEnd && selectionStart) {
      if (isSelecting) {
        if (selectionEnd > prefixLength) {
          e.preventDefault();
        }
      } else if (selectionStart > prefixLength) {
        e.preventDefault();
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayedValue = e.target.value;
    const newDefaultValue = newDisplayedValue.slice(0, -suffix.length);
    setDefaultValue(newDefaultValue);
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const pastedText = e.clipboardData.getData('Text');
    const { selectionStart, selectionEnd } = target;
    const prefixLength = target.value.length - suffix.length;

    const effectiveEnd = selectionStart === selectionEnd && selectionStart ? selectionStart + pastedText.length : selectionEnd;

    if ((effectiveEnd && effectiveEnd > prefixLength) || (selectionEnd && selectionEnd > prefixLength)) {
      e.preventDefault();
    }
  }

  return (

      <div className='relative w-full'>
        <Input
          className={`${className} ${prClass}`} 
          ref={inputRef}
          value={displayedValue}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onPaste={handlePaste}
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
                {isEnum ? (
                  <Fragment>
                    {isPending ? (
                      <div className="fullscreen flex items-center justify-center">
                        <Loader sz={24}/>
                      </div>
                    ) : (
                      <Fragment>
                        {enumVals && enumVals.map(s => (
                          <DropdownMenuItem
                            key={s}
                            className="flex flex-col items-start gap-1"
                            onClick={() => setDefaultValue(s)}
                          >
                            <div className="font-mono text-sm">{s}</div>
                          </DropdownMenuItem>
                        ))}
                      </Fragment>
                    )}
                  </Fragment>
                ) : (
                  <Fragment>
                    {defaultSuggestions(dtype as DATA_TYPES).map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        className="flex flex-col items-start gap-1"
                        onClick={() => setDefaultValue(s.value)}
                      >
                        <div className="font-mono text-sm">{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.desc}</div>
                      </DropdownMenuItem>
                    ))}
                  </Fragment>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
  )
}