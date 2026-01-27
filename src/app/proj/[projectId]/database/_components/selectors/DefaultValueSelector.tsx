"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DATA_TYPES } from "@/lib/types";
import { defaultSuggestions } from "@/lib/utils";
import { MenuIcon } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  defaultValue: string
  setDefaultValue: (value: string) => void
  dtype: typeof DATA_TYPES[keyof typeof DATA_TYPES]
  isArray: boolean,
  className?: string
}

export default function DefaultValueSelector({
  defaultValue,
  setDefaultValue,
  dtype,
  isArray,
  className
}: Props) {

  const suffix = isArray ? '[]' : '';
  const displayedValue = 
    defaultValue.startsWith("ARRAY[") 
      ? defaultValue.slice(6, -1) + suffix
      : defaultValue + suffix

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultValue !== "") return;
    switch (dtype) {
      case "uuid":
        if (defaultValue === "") break;
        setDefaultValue("uuid_generate_v4()");
        break
      case "timestamp with time zone":
        if (defaultValue === "") break;
        setDefaultValue("now()");
        break
      case "boolean":
        if (defaultValue === "") break;
        setDefaultValue("")
        break
      default:
        if (defaultValue === "") break;
        setDefaultValue("")
    }
  }, [dtype])

  const showDefaultMenu = dtype === "timestamp with time zone" || dtype === "uuid" || dtype === "boolean"

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