// SchemaPicker.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import CreateSchemaDialog from "./CreateSchemaDialog";
import { Separator } from "@/components/ui/separator";

type ComboboxButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  expanded: boolean;
  text: React.ReactNode;
};

const ComboboxButton = React.forwardRef<HTMLButtonElement, ComboboxButtonProps>(
  ({ expanded, text, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      role="combobox"
      aria-expanded={expanded}
      className={cn(
        "bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 w-fit justify-between items-center border-none shadow-none text-sm text-muted-foreground hover:text-foreground",
        props.className
      )}
      {...props}
    >
      {text}
      {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </Button>
  )
);
ComboboxButton.displayName = "ComboboxButton";

type SchemaPickerProps = {
  schemas: string[];
  value: string;
  onChange: (schema: string) => void;
};

const SchemaPicker = ({ schemas, value, onChange }: SchemaPickerProps) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ComboboxButton
          expanded={open}
          className="border-2 w-48"
          onClick={() => setOpen((v) => !v)}
          text={
            <p className="text-muted-foreground">
              schema <span className="dark:text-white text-black ml-1">{value}</span>
            </p>
          }
        />
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0 z-200" align="start">
        <Command>
          <CommandInput placeholder="Search schema..." className="h-9" />
          <CommandList>
            <CommandEmpty>No schemas found.</CommandEmpty>

            <CommandGroup>
              {schemas.map((row) => {
                const selected = value === row;
                return (
                  <CommandItem
                    key={row}
                    value={row}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                    }}
                  >
                    {row}
                    <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup>
              <Separator />
              <CreateSchemaDialog projectId={projectId} />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SchemaPicker;
