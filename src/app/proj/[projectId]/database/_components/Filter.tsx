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
import { FilterConfig, DATA_TYPES } from "@/lib/types";
import { X, Plus, FilterIcon, Trash2, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { FilterOperator, QueryFilters } from "@/lib/types";

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
      return ">";
    case FilterOperator.GREATER_THAN_OR_EQUAL_TO:
      return "≥";
    case FilterOperator.LESS_THAN:
      return "<";
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

// Get available operators for a data type
function getOperatorsForType(dataType: DATA_TYPES): FilterOperator[] {
  const common = [FilterOperator.EQUALS, FilterOperator.NOT_EQUAL, FilterOperator.IS, FilterOperator.IN];
  
  switch (dataType) {
    case DATA_TYPES.STRING:
      return [...common, FilterOperator.LIKE];
    
    case DATA_TYPES.INT:
    case DATA_TYPES.FLOAT:
    case DATA_TYPES.DateTime:
      return [
        ...common,
        FilterOperator.GREATER_THAN,
        FilterOperator.LESS_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL_TO,
        FilterOperator.LESS_THAN_OR_EQUAL_TO,
      ];
    
    case DATA_TYPES.BOOL:
      return [FilterOperator.EQUALS, FilterOperator.NOT_EQUAL, FilterOperator.IS];
    
    case DATA_TYPES.JSON:
      return [FilterOperator.EQUALS, FilterOperator.NOT_EQUAL, FilterOperator.IS, FilterOperator.LIKE];
    
    default:
      return common;
  }
}

// Validate filter value based on type
function validateFilterValue(value: string, dataType: DATA_TYPES, operator: FilterOperator): string | null {
  if (operator === FilterOperator.IS) {
    const upper = value.toUpperCase();
    if (!['NULL', 'NOT NULL', 'TRUE', 'FALSE'].includes(upper)) {
      return 'Must be: NULL, NOT NULL, TRUE, or FALSE';
    }
    if ((upper === 'TRUE' || upper === 'FALSE') && dataType !== DATA_TYPES.BOOL) {
      return 'TRUE/FALSE only valid for boolean columns';
    }
    return null;
  }

  if (!value.trim()) {
    return 'Value is required';
  }

  switch (dataType) {
    case DATA_TYPES.INT: {
      if (operator === FilterOperator.IN) {
        const items = value.split(',').map(s => s.trim());
        for (const item of items) {
          if (isNaN(parseInt(item, 10))) {
            return `"${item}" is not a valid integer`;
          }
        }
      } else {
        if (isNaN(parseInt(value, 10))) {
          return 'Must be a valid integer';
        }
      }
      break;
    }

    case DATA_TYPES.FLOAT: {
      if (operator === FilterOperator.IN) {
        const items = value.split(',').map(s => s.trim());
        for (const item of items) {
          if (isNaN(parseFloat(item))) {
            return `"${item}" is not a valid number`;
          }
        }
      } else {
        if (isNaN(parseFloat(value))) {
          return 'Must be a valid number';
        }
      }
      break;
    }

    case DATA_TYPES.BOOL: {
      const lower = value.toLowerCase().trim();
      if (!['true', 'false', 't', 'f', '1', '0', 'yes', 'no'].includes(lower)) {
        return 'Must be true or false';
      }
      break;
    }

    case DATA_TYPES.DateTime: {
      if (operator !== FilterOperator.IN) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Must be a valid date/time';
        }
      }
      break;
    }
  }

  return null;
}

// Get placeholder text based on type and operator
function getPlaceholder(dataType: DATA_TYPES, operator: FilterOperator): string {
  if (operator === FilterOperator.IS) {
    return 'NULL, NOT NULL, TRUE, FALSE';
  }

  if (operator === FilterOperator.IN) {
    switch (dataType) {
      case DATA_TYPES.INT:
        return 'e.g., 1,2,3';
      case DATA_TYPES.FLOAT:
        return 'e.g., 1.5,2.0,3.5';
      case DATA_TYPES.STRING:
        return 'e.g., value1,value2,value3';
      case DATA_TYPES.BOOL:
        return 'e.g., true,false';
      default:
        return 'Comma-separated values';
    }
  }

  switch (dataType) {
    case DATA_TYPES.INT:
      return 'Enter integer';
    case DATA_TYPES.FLOAT:
      return 'Enter number';
    case DATA_TYPES.BOOL:
      return 'true or false';
    case DATA_TYPES.DateTime:
      return 'YYYY-MM-DD or ISO date';
    case DATA_TYPES.STRING:
    default:
      return 'Enter value';
  }
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  data_type_enum: DATA_TYPES;
  is_nullable: string;
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
  columns: ColumnInfo[];
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  // local (draft) state inside the popover
  const [editingFilters, setEditingFilters] = useState<FilterConfig[]>([]);
  const [newFilterOperator, setNewFilterOperator] = useState<FilterOperator>(FilterOperator.EQUALS);
  const [newFilterColumn, setNewFilterColumn] = useState("");
  const [newFilterValue, setNewFilterValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Create column type lookup
  const columnTypeMap = useMemo(
    () => new Map(columns.map(c => [c.column_name, c.data_type_enum])),
    [columns]
  );

  const availableColumns = useMemo(
    () => columns.map((c) => c.column_name) as string[],
    [columns]
  );

  const unusedColumns = useMemo(
    () => availableColumns.filter((col) => !editingFilters.some((f) => f.column === col)),
    [availableColumns, editingFilters]
  );

  // Get the selected column's type
  const selectedColumnType = newFilterColumn 
    ? columnTypeMap.get(newFilterColumn) || DATA_TYPES.STRING
    : DATA_TYPES.STRING;

  // Get available operators for selected column
  const availableOperators = useMemo(
    () => newFilterColumn ? getOperatorsForType(selectedColumnType) : [],
    [newFilterColumn, selectedColumnType]
  );

  // Update operator when column changes if current operator isn't valid
  const handleColumnChange = (column: string) => {
    setNewFilterColumn(column);
    setNewFilterValue("");
    setValidationError(null);
    
    const colType = columnTypeMap.get(column) || DATA_TYPES.STRING;
    const validOps = getOperatorsForType(colType);
    
    if (!validOps.includes(newFilterOperator)) {
      setNewFilterOperator(validOps[0]);
    }
  };

  // Validate on value change
  const handleValueChange = (value: string) => {
    setNewFilterValue(value);
    
    if (!newFilterColumn) return;
    
    const error = validateFilterValue(value, selectedColumnType, newFilterOperator);
    setValidationError(error);
  };

  const canAdd = useMemo(() => {
    if (!newFilterColumn) return false;
    if (newFilterOperator === FilterOperator.IS && !newFilterValue.trim()) return false;
    if (newFilterOperator !== FilterOperator.IS && !newFilterValue.trim()) return false;
    return validationError === null;
  }, [newFilterColumn, newFilterOperator, newFilterValue, validationError]);

  const canApply = useMemo(() => {
    return editingFilters.every((f) => {
      const colType = columnTypeMap.get(f.column) || DATA_TYPES.STRING;
      const error = validateFilterValue(f.value, colType, f.operator);
      return error === null;
    });
  }, [editingFilters, columnTypeMap]);

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
    setNewFilterOperator(FilterOperator.EQUALS);
    setValidationError(null);
  };

  const removeFilter = (column: string) => {
    setEditingFilters((prev) => prev.filter((f) => f.column !== column));
  };

  const clearAll = () => {
    setEditingFilters([]);
    setNewFilterColumn("");
    setNewFilterValue("");
    setNewFilterOperator(FilterOperator.EQUALS);
    setValidationError(null);
  };

  const handleApply = () => {
    setActiveFilters(editingFilters);
    applyFiltersToUrl(editingFilters);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setEditingFilters(activeFilters);
          setValidationError(null);
        }
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

      <PopoverContent className="w-[560px] p-0" align="start">
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
              disabled={!canApply}
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
              {editingFilters.map((f) => {
                const colType = columnTypeMap.get(f.column) || DATA_TYPES.STRING;
                return (
                  <div
                    key={f.column}
                    className="grid grid-cols-[1.2fr_0.9fr_1.4fr_auto] items-center gap-2 rounded-md border bg-background px-2 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Column</div>
                      <div className="truncate text-sm font-medium">{f.column}</div>
                      <div className="text-[10px] text-muted-foreground">{colType}</div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Operator</div>
                      <div className="truncate text-sm">{opLabel(f.operator)}</div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Value</div>
                      <div className="truncate font-mono text-sm">
                        {f.operator === FilterOperator.IS ? f.value.toUpperCase() : f.value}
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
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              No filters yet. Add one below.
            </div>
          )}

          {/* Add new filter row */}
          <div className="mt-3 rounded-md border bg-background p-2">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Add filter</div>

            <div className="grid grid-cols-[1.2fr_0.9fr_1.4fr] gap-2">
              <div className="space-y-1">
                <Select value={newFilterColumn} onValueChange={handleColumnChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={unusedColumns.length ? "Select column" : "No columns left"} />
                  </SelectTrigger>
                  <SelectContent>
                    {unusedColumns.map((col) => {
                      const colType = columnTypeMap.get(col);
                      return (
                        <SelectItem key={col} value={col}>
                          <div className="flex items-center gap-2">
                            <span>{col}</span>
                            <span className="text-xs text-muted-foreground">({colType})</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={newFilterOperator}
                onValueChange={(v) => {
                  setNewFilterOperator(v as FilterOperator);
                  setNewFilterValue("");
                  setValidationError(null);
                }}
                disabled={!newFilterColumn}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {opLabel(op)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1">
                <Input
                  className={`h-9 ${validationError ? 'border-red-500' : ''}`}
                  placeholder={getPlaceholder(selectedColumnType, newFilterOperator)}
                  value={newFilterValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  disabled={!newFilterColumn}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAdd) addFilter();
                  }}
                />
              </div>
            </div>

            {validationError && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {validationError}
              </div>
            )}

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