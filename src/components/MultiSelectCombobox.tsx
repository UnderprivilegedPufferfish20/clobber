import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronsUpDown, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

export function MultiSelectCombobox({
  options = [],
  value = [],
  onChange,
  placeholder = "Select items...",
}: {
  options: string[]           
  value: string[]           
  onChange: (vals: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(
    () =>
      options.filter((opt) =>
        opt.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ),
    [searchTerm, options]
  );

  useEffect(() => {
    setSearchTerm("");
    setSelectedIndex(-1);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(filtered.length > 0 ? 0 : -1);
  }, [filtered]);

  useEffect(() => {
    //@ts-ignore
    if (open) inputRef.current?.focus();
  }, [open]);

  const toggle = (opt: string) => {
    onChange(
      selectedSet.has(opt) ? value.filter((v) => v !== opt) : [...value, opt]
    );
  };

  const remove = (opt: string, e:any) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== opt));
  };

  const clearAll = (e:any) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* ── Trigger with badges ── */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-h-10 h-auto w-full justify-between px-3 py-2 font-normal"
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="flex items-center gap-1 pr-1 rounded-md!"
                >
                  {v}
                  <span
                    role="button"
                    tabIndex={0}
                    
                    onKeyDown={(e) => e.key === "Enter" && remove(v, e)}
                    className="rounded-full hover:bg-muted cursor-pointer p-0.5"
                    aria-label={`Remove ${v}`}
                  >
                    <X 
                      className="h-3 w-3"
                      onClick={(e) => remove(v, e)}
                    />
                  </span>
                </Badge>
              ))
            )}
          </div>

          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                
                onKeyDown={(e) => e.key === "Enter" && clearAll(e)}
                className="rounded-full hover:bg-muted p-0.5 cursor-pointer"
                aria-label="Clear all"
              >
                <X 
                  className="h-4 w-4 text-muted-foreground"
                  onClick={clearAll} 
                />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      {/* ── Dropdown content ── */}
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) p-0 z-500"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-2 p-2">
            {/* Search — stop DropdownMenu from stealing key events */}
            <div onKeyDown={(e) => e.stopPropagation()}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  className="pl-8 pr-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (filtered.length > 0)
                        setSelectedIndex((p) => (p + 1) % filtered.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      if (filtered.length > 0)
                        setSelectedIndex(
                          (p) => (p - 1 + filtered.length) % filtered.length
                        );
                    } else if (e.key === "Enter" && selectedIndex >= 0) {
                      e.preventDefault();
                      toggle(filtered[selectedIndex]);
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <Separator className="mt-1" />
          </DropdownMenuLabel>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground my-4">
              <p className="text-sm">No results</p>
              <Button
                variant="ghost"
                className="h-auto p-1 hover:underline text-xs"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </Button>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((opt, index) => (
              <DropdownMenuCheckboxItem
                key={opt}
                onSelect={(e) => e.preventDefault()}
                onPointerDown={(e) => e.preventDefault()}
                onPointerMove={(e) => e.preventDefault()}
                checked={selectedSet.has(opt)}
                onCheckedChange={() => toggle(opt)}
                className={cn(
                  "group flex items-center justify-between cursor-pointer",
                  selectedIndex === index && "bg-accent text-accent-foreground"
                )}
              >
                <span>{opt}</span>
                <span
                  className="hidden group-hover:block text-xs text-muted-foreground hover:text-foreground mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([opt]);
                  }}
                >
                  Only
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                <span>{value.length} selected</span>
                <button
                  onClick={() => onChange([])}
                  className="hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}