"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Table2Icon,
  Link2Icon,
  EllipsisVerticalIcon,
  XIcon,
  MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import {
  DATA_TYPES_LIST,
  FKEY_REFERENCED_ROW_ACTION_DELETED_LIST,
  FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST,
} from "@/lib/constants";
import type {
  ColumnType,
  DATA_TYPE_TYPE,
  FKEY_REFERENCED_ROW_ACTION_DELETED,
  FKEY_REFERENCED_ROW_ACTION_UPDATED,
  FkeyType,
  TableType,
} from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getSchema, getSchemas } from "@/lib/actions/database/cache-actions";
import { getCols } from "@/lib/actions/database/columns/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { addTable, updateTable } from "@/lib/actions/database/tables";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import DataTypeSelect from "../DataTypeSelect";
import { defaultSuggestions } from "@/lib/utils";
import DefaultValueSelector from "../DefaultValueSelector";


function EditTableSheet({
  projectId,
  schema,
  table,
  open,
  onOpenChange,
}: {
  projectId: string;
  schema: string;
  table: TableType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const emptyColumn: ColumnType = {
    name: "",
    dtype: "integer",      // or DATA_TYPES.INT if that matches your enum
    isArray: false,
    default: undefined,
    isPkey: false,
    isUnique: false,
    isNullable: true,
  };


  const [columns, setColumns] = useState<ColumnType[]>(table.columns)
  const [deletedCols, setDeletedCols] = useState<string[]>([])
  const [renamedCols, setRenamedCols] = useState<{ oldName: string, newName: string }[]>([])

  const [name, setName] = useState(table.name)

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateTable(
        projectId,
        schema,
        table,  
        {
          name,
          columns
        }, 
        renamedCols,
        deletedCols
    ),
    onSuccess: () => {
      toast.success("Table updated successfully", { id: "edit-table" });
      
      onOpenChange(false);
    },
    onMutate(variables, context) {
      toast.loading("Updating Table...", { id: "edit-table" })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to edit table", { id: "edit-table" });
    }
  })

  function updateColumn(idx: number, patch: Partial<ColumnType>) {
    setColumns((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );

    if (patch.name) {
      setRenamedCols(p => [...p, { oldName: columns[idx].name,  }])
    }
  }

  function deleteColumn(idx: number) {
    setColumns((prev) => {
      const col = prev[idx];
      if (!col) return prev;

      return prev.filter((_, i) => i !== idx);
    });
    setDeletedCols(p => [...p, columns[idx].name])
  }

  const getCheckedOptions = (col: any) => {
    return [col.isArray, col.isNullable, col.isUnique].filter(t => t === true).length
  }

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  const isDirty = () => {
    return columns === table.columns && name === table.name
  }

  const handleOpenChange = (o: boolean) => {
    if (o) {
      onOpenChange(true);
      return;
    }

    if (!isDirty()) {
      onOpenChange(false);
      return;
    }

    setIsConfirmCloseOpen(true);
  };

  const getDefaultForType = (dtype: DATA_TYPE_TYPE) => {
    switch (dtype) {
      case "uuid":
        return "uuid_generate_v4()";
      case "datetime":
        return "now()";
      default:
        return "";
    }
  };

  


  return (
    <>
    
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto p-0! z-100 focus:outline-none fullheight">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit {table.name}</SheetTitle>
            <SheetDescription>
              Change properties of {table.name}
            </SheetDescription>
          </SheetHeader>
          <Separator />

          <div className='space-y-6 p-6 flex-1'>

            <div className='flex flex-col gap-2'>
              <h1>Name</h1>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                id='table-name'
              />
            </div>

            <div className="flex flex-col gap-6">
              <h1>Columns</h1>

              <div className="flex flex-col gap-1">
                <div className="fullwidth flex items-center pl-2 text-muted-foreground text-sm">
                  <h1 className="pr-25">Name</h1>
                  <h1 className="pr-32">Type</h1>
                  <h1 className="pr-16">Default Value</h1>
                  <h1>Primary Key</h1>
                </div>

                <div className='fullwidth flex flex-col gap-1'>
                  {columns.map((col, idx) => {

                    const updateDefault = (value: string) => {
                      updateColumn(idx, { default: value });
                    };

                    return (
                        <div
                          key={`${col.name ?? "new"}:${idx}`}
                          className={`${col.isPkey && "bg-white/5"} flex items-center gap-2 fullwidth p-2 relative rounded-md border border-border`}
                        >
  
                          
  
                          <Input
                            value={col.name}
                            onChange={(e) => updateColumn(idx, { name: e.target.value })}
                            className="focus-visible:ring-0 focus-visible:ring-offset-0 max-w-32 min-w-32 w-32"
                          />
  
                          <DataTypeSelect
                            triggerClassname="max-w-35 min-w-35 w-35 truncate" 
                            value={col.dtype}
                            onValueChange={(v) => updateColumn(idx, { dtype: v as DATA_TYPE_TYPE, default: getDefaultForType(v as DATA_TYPE_TYPE) })}
                          />
                          
                          <DefaultValueSelector 
                            defaultValue={col.default ?? ""}
                            dtype={col.dtype}
                            setDefaultValue={updateDefault}
                            className='truncate focus-visible:ring-0 focus-visible:ring-offset-0'
                          />
  
                          <Checkbox
                            className={`w-6 h-6 ${col.isPkey ? "mr-30" : "mr-18"}`}
                            checked={col.isPkey}
                            onCheckedChange={(v) => updateColumn(idx, { isPkey: Boolean(v), isArray: false })}
                          />
  
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className={`${col.isPkey && "hidden"} relative`} type="button">
                                {getCheckedOptions(col) > 0 && (
                                  <Badge className="absolute top-0 left-0 w-3 h-4">{getCheckedOptions(col)}</Badge>
                                )}
                                <EllipsisVerticalIcon className="w-6 h-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="z-140" align="end">
                              <DropdownMenuLabel>More Options</DropdownMenuLabel>
  
                              <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                                <Checkbox
                                  id={`isNullable-${idx}`}
                                  checked={col.isNullable}
                                  onCheckedChange={(v) => updateColumn(idx, { isNullable: Boolean(v) })}
                                />
                                <Label htmlFor={`isNullable-${idx}`}>Is Nullable</Label>
                              </DropdownMenuItem>
  
                              <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                                <Checkbox
                                  id={`isUnique-${idx}`}
                                  checked={col.isUnique}
                                  onCheckedChange={(v) => updateColumn(idx, { isUnique: Boolean(v) })}
                                />
                                <Label htmlFor={`isUnique-${idx}`}>Is Unique</Label>
                              </DropdownMenuItem>
  
                              {!col.isPkey && (
                                <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                                  <Checkbox
                                    id={`isArray-${idx}`}
                                    checked={col.isArray}
                                    onCheckedChange={(v) => updateColumn(idx, { isArray: Boolean(v) })}
                                  />
                                  <Label htmlFor={`isArray-${idx}`}>Is Array</Label>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
  
                          <Button variant="ghost" type="button" onClick={() => deleteColumn(idx)}>
                            <XIcon className="w-6 h-6" />
                          </Button>
                        </div>
                    )
                  })}
                </div>
                
                <div
                  className={`flex items-center justify-center fullwidth relative rounded-md border border-border py-2 mt-2`}
                >
                  <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setColumns((p) => [...p, emptyColumn])}>
                    Add Column
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black w-full overflow-hidden flex items-center justify-end sticky bottom-0 border-t gap-2 p-3 pr-6 h-18 min-h-18 max-h-18">
            <SheetClose asChild>
              <Button variant={"secondary"}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={() => mutate()} variant={"default"} disabled={columns.length === 0 || !name}>
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Create Table
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isConfirmCloseOpen}
        onOpenChange={setIsConfirmCloseOpen}
      >
        <AlertDialogContent className="z-160">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setIsConfirmCloseOpen(false);
            }}
          >
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setIsConfirmCloseOpen(false);
              onOpenChange(false);

              setName(table.name)
              setColumns(table.columns)
            }}
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default EditTableSheet;