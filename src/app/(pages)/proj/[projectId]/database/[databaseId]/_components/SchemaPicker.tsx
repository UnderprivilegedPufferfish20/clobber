"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  rows: { nspname: string }[];
  projectId: string;
  databaseId: string;
};

function ComboboxButton({ expanded, text }: { expanded: boolean; text: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={expanded}
      className="bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 w-fit ml-2 justify-between items-center border-none shadow-none text-sm text-muted-foreground hover:text-foreground"
    >
      {text}
      {expanded ? (
        <ChevronUpIcon />
      ) : (
        <ChevronDownIcon />
      )}
    </Button>
  );
}

const SchemaPicker: React.FC<Props> = ({ rows, projectId, databaseId }) => {
  console.log("@@Schema Picker: ", rows)

  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(rows[0]['nspname']);

  const label = value || "Select schema";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <ComboboxButton expanded={open} text={<p className="text-muted-foreground">schema <span className="dark:text-white text-black ml-1">{value}</span></p>} />
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0 z-50">
        <Command>
          <CommandInput placeholder="Search schema..." className="h-9" />
          <CommandList>
            <CommandEmpty>No schemas found.</CommandEmpty>

            <CommandGroup>
              {rows.map((row) => {
                const selected = value === row.nspname;
                return (
                  <CommandItem
                    key={row.nspname}
                    value={row.nspname}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      router.push(
                        `/proj/${projectId}/database/${databaseId}?schema=${currentValue}`
                      );
                    }}
                  >
                    {row.nspname}
                    <Check
                      className={cn(
                        "ml-auto",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
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
