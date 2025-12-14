"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type ComboboxButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  expanded: boolean;
  text: React.ReactNode;
};

const ComboboxButton = React.forwardRef<HTMLButtonElement, ComboboxButtonProps>(
  ({ expanded, text, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        role="combobox"
        aria-expanded={expanded}
        className={cn(
          "bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 w-fit ml-2 justify-between items-center border-none shadow-none text-sm text-muted-foreground hover:text-foreground",
          props.className
        )}
        {...props}
      >
        {text}
        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </Button>
    );
  }
);
ComboboxButton.displayName = "ComboboxButton";

const SchemaPicker = ({ schemas }: { schemas: string[] }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(schemas[0] ?? "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ComboboxButton
          expanded={open}
          // IMPORTANT: allow trigger click to work by forwarding refs/handlers
          onClick={() => setOpen((v) => !v)}
          text={
            <p className="text-muted-foreground">
              schema{" "}
              <span className="dark:text-white text-black ml-1">{value}</span>
            </p>
          }
        />
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0 z-50" align="start">
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
                      setValue(currentValue);
                      setOpen(false);
                      router.push(`${pathname}?schema=${encodeURIComponent(currentValue)}`);
                    }}
                  >
                    {row}
                    <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SchemaPicker;
