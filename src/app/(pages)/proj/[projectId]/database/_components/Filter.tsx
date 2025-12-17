"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FilterConfig } from "@/lib/types";
import { X, Plus, FilterIcon, Trash2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { FilterOperator, QueryFilters } from "@/lib/types"; // adjust import path

const OP_TO_TOKEN: Record<FilterOperator, string> = {
  [FilterOperator.EQUALS]: "=",
  [FilterOperator.NOT_EQUAL]: "<>",
  [FilterOperator.GREATER_THAN]: ">",
  [FilterOperator.LESS_THAN]: "<",
  [FilterOperator.GREATER_THAN_OR_EQUAL_TO]: ">=",
  [FilterOperator.LESS_THAN_OR_EQUAL_TO]: "<=",
  [FilterOperator.LIKE]: "~~",
  [FilterOperator.IN]: "IN",
  [FilterOperator.IS]: "IS",
};

const TOKEN_TO_OP: Record<string, FilterOperator> = Object.fromEntries(
  Object.entries(OP_TO_TOKEN).map(([k, v]) => [v, k as FilterOperator])
);

export function stringifyFilters(filters: QueryFilters): string {
  return Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([col, [op, value]]) => `${col}:${OP_TO_TOKEN[op]}:${encodeURIComponent(value ?? "")}`)
    .join(",");
}

export function parseFiltersParam(filterParam: string | null): QueryFilters {
  if (!filterParam) return {};
  const parts = filterParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const out: QueryFilters = {};

  for (const part of parts) {
    const firstColon = part.indexOf(":");
    const secondColon = firstColon === -1 ? -1 : part.indexOf(":", firstColon + 1);
    if (firstColon === -1 || secondColon === -1) continue;

    const col = part.slice(0, firstColon).trim();
    const token = part.slice(firstColon + 1, secondColon).trim();
    const rawValue = part.slice(secondColon + 1);

    if (!col) continue;

    const op = TOKEN_TO_OP[token];
    if (!op) continue;

    const value = decodeURIComponent(rawValue ?? "");
    out[col] = [op, value];
  }

  return out;
}

function opLabel(op: FilterOperator) {
  switch (op) {
    case FilterOperator.LIKE:
      return "contains";
    case FilterOperator.EQUALS:
      return "equals";
    case FilterOperator.NOT_EQUAL:
      return "not equal";
    case FilterOperator.GREATER_THAN:
      return "greater than";
    case FilterOperator.GREATER_THAN_OR_EQUAL_TO:
      return "≥";
    case FilterOperator.LESS_THAN:
      return "less than";
    case FilterOperator.LESS_THAN_OR_EQUAL_TO:
      return "≤";
    case FilterOperator.IN:
      return "in";
    case FilterOperator.IS:
      return "is";
    default:
      return op;
  }
}

const Filter = ({
  activeFilters,
  setActiveFilters,
  setStartPage,
  columns,
}: {
  activeFilters: FilterConfig[];
  setActiveFilters: Dispatch<SetStateAction<FilterConfig[]>>;
  setStartPage: Dispatch<SetStateAction<number>>;
  columns: any[];
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  // local (draft) state inside the popover
  const [editingFilters, setEditingFilters] = useState<FilterConfig[]>([]);
  const [newFilterOperator, setNewFilterOperator] = useState<FilterOperator>(FilterOperator.LIKE);
  const [newFilterColumn, setNewFilterColumn] = useState("");
  const [newFilterValue, setNewFilterValue] = useState("");

  const availableColumns = useMemo(
    () => columns.map((c: any) => c.column_name) as string[],
    [columns]
  );

  const unusedColumns = useMemo(
    () => availableColumns.filter((col) => !editingFilters.some((f) => f.column === col)),
    [availableColumns, editingFilters]
  );

  const canAdd =
    !!newFilterColumn && (newFilterOperator === FilterOperator.IS || !!newFilterValue.trim());

  const canApply =
    editingFilters.length > 0 &&
    editingFilters.every(
      (f) => !!f.column && (f.operator === FilterOperator.IS || !!f.value?.trim())
    );

  const applyFiltersToUrl = (filters: FilterConfig[]) => {
    const newParams = new URLSearchParams(searchParams.toString());

    const qf: QueryFilters = {};
    for (const f of filters) {
      if (!f.column) continue;
      if (f.operator !== FilterOperator.IS && !f.value.trim()) continue;
      qf[f.column] = [f.operator, f.value.trim()];
    }

    const encoded = stringifyFilters(qf);

    if (encoded) newParams.set("filter", encoded);
    else newParams.delete("filter");

    flushSync(() => setStartPage(1));
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const addFilter = () => {
    if (!canAdd) return;

    const updated = [
      ...editingFilters.filter((f) => f.column !== newFilterColumn),
      { column: newFilterColumn, operator: newFilterOperator, value: newFilterValue },
    ];

    setEditingFilters(updated);
    setNewFilterColumn("");
    setNewFilterValue("");
    setNewFilterOperator(FilterOperator.LIKE);
  };

  const removeFilter = (column: string) => {
    setEditingFilters((prev) => prev.filter((f) => f.column !== column));
  };

  const clearAll = () => {
    setEditingFilters([]);
    setNewFilterColumn("");
    setNewFilterValue("");
    setNewFilterOperator(FilterOperator.LIKE);
  };

  const handleApply = () => {
    // persist + close
    setActiveFilters(editingFilters);
    applyFiltersToUrl(editingFilters);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setEditingFilters(activeFilters);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* Supabase-ish: header actions, rows list, "add new" row */}
      <PopoverContent className="w-[520px] p-0" align="start">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {editingFilters.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {editingFilters.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editingFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 gap-2 px-2 text-xs"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}

            {/* TOP actions (per your ask) */}
            <Button
              size="sm"
              variant="secondary"
              onClick={addFilter}
              disabled={!canAdd || unusedColumns.length === 0}
              className="h-8 gap-2 px-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={!canApply && editingFilters.length > 0 ? true : editingFilters.length === 0}
              className="h-8 px-3 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="p-3">
          {/* Applied (draft) list */}
          {editingFilters.length > 0 ? (
            <div className="space-y-2">
              {editingFilters.map((f) => (
                <div
                  key={f.column}
                  className="grid grid-cols-[1.2fr_0.9fr_1.4fr_auto] items-center gap-2 rounded-md border bg-background px-2 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">Column</div>
                    <div className="truncate text-sm font-medium">{f.column}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">Operator</div>
                    <div className="truncate text-sm">{opLabel(f.operator)}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">Value</div>
                    <div className="truncate font-mono text-sm">
                      {f.operator === FilterOperator.IS ? "(null check)" : f.value}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(f.column)}
                    className="h-8 w-8 p-0"
                    aria-label={`Remove filter for ${f.column}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              No filters yet. Add one below.
            </div>
          )}

          {/* Add new filter row (Supabase-ish) */}
          <div className="mt-3 rounded-md border bg-background p-2">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Add filter</div>

            <div className="grid grid-cols-[1.2fr_0.9fr_1.4fr] gap-2">
              <Select value={newFilterColumn} onValueChange={setNewFilterColumn}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={unusedColumns.length ? "Select column" : "No columns left"} />
                </SelectTrigger>
                <SelectContent>
                  {unusedColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newFilterOperator}
                onValueChange={(v) => setNewFilterOperator(v as FilterOperator)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FilterOperator.LIKE}>contains</SelectItem>
                  <SelectItem value={FilterOperator.EQUALS}>equals</SelectItem>
                  <SelectItem value={FilterOperator.NOT_EQUAL}>not equal</SelectItem>
                  <SelectItem value={FilterOperator.GREATER_THAN}>&gt;</SelectItem>
                  <SelectItem value={FilterOperator.GREATER_THAN_OR_EQUAL_TO}>&gt;=</SelectItem>
                  <SelectItem value={FilterOperator.LESS_THAN}>&lt;</SelectItem>
                  <SelectItem value={FilterOperator.LESS_THAN_OR_EQUAL_TO}>&lt;=</SelectItem>
                  <SelectItem value={FilterOperator.IN}>in</SelectItem>
                  <SelectItem value={FilterOperator.IS}>is</SelectItem>
                </SelectContent>
              </Select>

              <Input
                className="h-9"
                placeholder={newFilterOperator === FilterOperator.IS ? "—" : "Value"}
                value={newFilterValue}
                onChange={(e) => setNewFilterValue(e.target.value)}
                disabled={newFilterOperator === FilterOperator.IS}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addFilter();
                }}
              />
            </div>

            {unusedColumns.length === 0 && editingFilters.length > 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                All columns have filters applied.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Filter;
