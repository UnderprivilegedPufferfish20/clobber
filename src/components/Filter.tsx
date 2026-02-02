"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { FilterConfig, DATA_TYPES, FilterOperator, ColumnType } from "@/lib/types";
import { stringifyFilters, OP_TO_TOKEN, OP_TO_LABEL } from "@/lib/utils";
import { X, Plus, Filter, Trash2, AlertCircle, FilterIcon, PlusIcon, XIcon } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const FilterComponent = ({
  activeFilters,
  setActiveFilters,
  columns,
}: {
  activeFilters: FilterConfig[];
  setActiveFilters: Dispatch<SetStateAction<FilterConfig[]>>;
  columns: ColumnType[];
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig[]>(activeFilters);

  // Clean functional updates - use index correctly
  const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { 
      column: columns[0]?.name || '', 
      operator: FilterOperator.EQUALS, 
      value: "" 
    }]);
  };

  const applyFilters = () => {
    setActiveFilters(filters);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className="relative">
        <Button className="relative flex items-center gap-2" variant="outline">
          <FilterIcon className="w-4 h-4"/>
          <h1>Filters</h1>
          <div className={`${
            activeFilters.length === 0 && "hidden"
          } absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-background`}> 
            {activeFilters.length} 
          </div> 
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-md p-0 max-h-96 overflow-y-auto">
        <DropdownMenuGroup>
          {filters.length === 0 && (
            <div className="flex flex-col p-4">
              <h1 className="text-sm">No Filters</h1>
            </div>
          )}
          {filters.map((f, index) => (
            <div key={index} className="flex items-center gap-1 p-2 border-b last:border-b-0">
              <Select
                value={f.column}
                onValueChange={(v) => updateFilter(index, { column: v })}
              >
                <SelectTrigger className="w-39! min-w-39! max-w-39! truncate!">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-150">
                  <SelectGroup>
                    <SelectLabel>Columns</SelectLabel>
                    {columns.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={f.operator}
                onValueChange={(v) => updateFilter(index, { operator: v as FilterOperator })}
              >
                <SelectTrigger className="w-19! min-w-19! max-w-19! truncate!">
                  <SelectValue>
                    {filters[index]?.operator && OP_TO_TOKEN[filters[index].operator]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-150" align="start">
                  <SelectGroup>
                    <SelectLabel>Operators</SelectLabel>
                    {Object.values(FilterOperator).map((op) => (
                      <SelectItem key={OP_TO_TOKEN[op]} value={OP_TO_TOKEN[op]} className="flex items-center gap-2">
                        <p>{OP_TO_TOKEN[op]}</p>
                        <p>{OP_TO_LABEL[op]}</p>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Input
                className="w-39! min-w-39! max-w-39!"
                value={f.value}
                onChange={(e) => updateFilter(index, { value: e.target.value })}
              />

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFilter(index)}
              >
                <XIcon className="w-4 h-4"/>
              </Button>
            </div>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup className="flex items-center justify-between p-3">
          <Button
            size="sm"
            variant="outline"
            onClick={addFilter}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4"/>
            Add Clause
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={applyFilters}
            
            disabled={JSON.stringify(filters) === JSON.stringify(activeFilters)}
          >
            Apply Filters
          </Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FilterComponent;