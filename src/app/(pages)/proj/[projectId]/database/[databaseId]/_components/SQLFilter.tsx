"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Filter } from "lucide-react";
import { DATA_TYPES } from "@/lib/types";

export type FilterOperator = 
  | "EQUALS" 
  | "NOT_EQUALS" 
  | "LIKE" 
  | "NOT_LIKE" 
  | "IN" 
  | "NOT_IN"
  | "GREATER_THAN" 
  | "LESS_THAN" 
  | "GREATER_EQUAL" 
  | "LESS_EQUAL"
  | "IS_NULL"
  | "IS_NOT_NULL";

export type LogicalOperator = "AND" | "OR";

export type FilterCondition = {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
  logicalOperator?: LogicalOperator;
};

export type SqlFilterProps = {
  columns: Record<string, DATA_TYPES>;
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  className?: string;
};

const OPERATORS_BY_TYPE: Record<DATA_TYPES, FilterOperator[]> = {
  [DATA_TYPES.STRING]: [
    "EQUALS", "NOT_EQUALS", "LIKE", "NOT_LIKE", "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"
  ],
  [DATA_TYPES.INT]: [
    "EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "GREATER_EQUAL", "LESS_EQUAL", 
    "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"
  ],
  [DATA_TYPES.FLOAT]: [
    "EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "GREATER_EQUAL", "LESS_EQUAL", 
    "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"
  ],
  [DATA_TYPES.BOOL]: [
    "EQUALS", "NOT_EQUALS", "IS_NULL", "IS_NOT_NULL"
  ],
  [DATA_TYPES.DateTime]: [
    "EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "GREATER_EQUAL", "LESS_EQUAL", 
    "IS_NULL", "IS_NOT_NULL"
  ],
  [DATA_TYPES.EMAIL]: [
    "EQUALS", "NOT_EQUALS", "LIKE", "NOT_LIKE", "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"
  ],
  [DATA_TYPES.URL]: [
    "EQUALS", "NOT_EQUALS", "LIKE", "NOT_LIKE", "IN", "NOT_IN", "IS_NULL", "IS_NOT_NULL"
  ],
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  EQUALS: "Equals",
  NOT_EQUALS: "Not Equals",
  LIKE: "Contains",
  NOT_LIKE: "Not Contains",
  IN: "In List",
  NOT_IN: "Not In List",
  GREATER_THAN: "Greater Than",
  LESS_THAN: "Less Than",
  GREATER_EQUAL: "Greater or Equal",
  LESS_EQUAL: "Less or Equal",
  IS_NULL: "Is Null",
  IS_NOT_NULL: "Is Not Null",
};

const VALUE_REQUIRED_OPERATORS: FilterOperator[] = [
  "EQUALS", "NOT_EQUALS", "LIKE", "NOT_LIKE", "IN", "NOT_IN",
  "GREATER_THAN", "LESS_THAN", "GREATER_EQUAL", "LESS_EQUAL"
];

function FilterConditionEditor({
  condition,
  columns,
  onUpdate,
  onRemove,
  showLogicalOperator = false,
}: {
  condition: FilterCondition;
  columns: Record<string, DATA_TYPES>;
  onUpdate: (condition: FilterCondition) => void;
  onRemove: () => void;
  showLogicalOperator?: boolean;
}) {
  const columnType = columns[condition.column];
  const availableOperators = OPERATORS_BY_TYPE[columnType] || [];
  const needsValue = VALUE_REQUIRED_OPERATORS.includes(condition.operator);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-muted/50">
      {showLogicalOperator && (
        <Select
          value={condition.logicalOperator || "AND"}
          onValueChange={(value: LogicalOperator) =>
            onUpdate({ ...condition, logicalOperator: value })
          }
        >
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Select
        value={condition.column}
        onValueChange={(value) => {
          // Reset operator when column changes as available operators may differ
          const newColumnType = columns[value];
          const newAvailableOperators = OPERATORS_BY_TYPE[newColumnType] || [];
          const newOperator = newAvailableOperators.includes(condition.operator) 
            ? condition.operator 
            : newAvailableOperators[0];
          
          onUpdate({ 
            ...condition, 
            column: value, 
            operator: newOperator,
            value: "" // Reset value when column changes
          });
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columns).map((col) => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(value: FilterOperator) =>
          onUpdate({ ...condition, operator: value, value: needsValue ? condition.value : "" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsValue && (
        <Input
          placeholder={
            condition.operator === "IN" || condition.operator === "NOT_IN"
              ? "value1,value2,value3"
              : columnType === DATA_TYPES.DateTime
              ? "YYYY-MM-DD or YYYY-MM-DD HH:mm:ss"
              : "Enter value..."
          }
          value={condition.value}
          onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
          className="min-w-48"
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SqlFilter({ columns, filters, onFiltersChange, className }: SqlFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterCondition[]>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substr(2, 9),
      column: Object.keys(columns)[0] || "",
      operator: "EQUALS",
      value: "",
      logicalOperator: localFilters.length > 0 ? "AND" : undefined,
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const updateFilter = (id: string, updatedFilter: FilterCondition) => {
    setLocalFilters(localFilters.map(f => f.id === id ? updatedFilter : f));
  };

  const removeFilter = (id: string) => {
    const newFilters = localFilters.filter(f => f.id !== id);
    // Remove logical operator from first filter if it exists
    if (newFilters.length > 0 && newFilters[0].logicalOperator) {
      newFilters[0] = { ...newFilters[0], logicalOperator: undefined };
    }
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    setLocalFilters([]);
    onFiltersChange([]);
  };

  const activeFiltersCount = filters.length;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 min-w-5 text-xs px-1.5"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {localFilters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No filters applied. Click "Add Filter" to get started.
                </div>
              ) : (
                localFilters.map((filter, index) => (
                  <FilterConditionEditor
                    key={filter.id}
                    condition={filter}
                    columns={columns}
                    onUpdate={(updated) => updateFilter(filter.id, updated)}
                    onRemove={() => removeFilter(filter.id)}
                    showLogicalOperator={index > 0}
                  />
                ))
              )}

              <div className="flex justify-between pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFilter}
                    disabled={Object.keys(columns).length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Filter
                  </Button>
                  
                  {localFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}