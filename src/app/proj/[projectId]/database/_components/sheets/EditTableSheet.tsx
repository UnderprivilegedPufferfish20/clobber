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
  TableType,
} from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getSchema, getSchemas } from "@/lib/actions/database/cache-actions";
import { getCols } from "@/lib/actions/database/columns/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { updateTable } from "@/lib/actions/database/tables";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import DataTypeSelect from "../DataTypeSelect";


// Client-only metadata so we can compute renamed/deleted for updateTable()
type UIColumn = ColumnType & {
  _originName?: string; // name when loaded from DB
  _isNew?: boolean; // true for columns created in the editor
};

function stripMeta(cols: UIColumn[]): ColumnType[] {
  return cols.map(({ _originName, _isNew, ...c }) => c);
}

function EditTableSheet({
  projectId,
  schema,
  tableToBeEdited,
  open,
  onOpenChange,
}: {
  projectId: string;
  schema: string;
  tableToBeEdited: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: table, isLoading: tableLoading } = useQuery({
    queryKey: ["table", projectId, schema, tableToBeEdited],
    queryFn: async () => {
      const fullschema = await getSchema(projectId, schema);
      const t = fullschema.find((t) => t.name === tableToBeEdited);
      if (!t) throw new Error("Cannot find table to be edited");
      return t as TableType;
    },
    enabled: Boolean(projectId && schema && tableToBeEdited && open),
  });

  // ---------------------------------------
  // Local editor state (name + columns)
  // ---------------------------------------
  const [name, setName] = useState("");
  const [columns, setColumns] = useState<UIColumn[]>([]);
  const [deletedCols, setDeletedCols] = useState<string[]>([]);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  useEffect(() => {
    if (!table) return;

    setName(table.name);

    // Add metadata used for diffing
    setColumns(
      table.columns.map((c) => ({
        ...c,
        _originName: c.name,
        _isNew: false,
      }))
    );

    setDeletedCols([]);
  }, [table]);

  const isDirty = useMemo(() => {
    if (!table) return false;
    if (name !== table.name) return true;
    if (deletedCols.length > 0) return true;

    const currentCols = stripMeta(columns);
    if (currentCols.length !== table.columns.length) return true;

    for (let i = 0; i < currentCols.length; i++) {
      if (JSON.stringify(currentCols[i]) !== JSON.stringify(table.columns[i])) return true;
    }

    return false;
  }, [name, columns, deletedCols, table]);

  const handleOpenChange = (o: boolean) => {
    if (o) {
      onOpenChange(true);
      return;
    }

    if (!isDirty) {
      onOpenChange(false);
      return;
    }

    setIsConfirmCloseOpen(true);
  };

  const emptyColumn: UIColumn = useMemo(
    () => ({
      name: "",
      dtype: "string",
      isArray: false,
      default: undefined,
      isPkey: false,
      isUnique: false,
      isNullable: true,
      fkey: undefined,
      _isNew: true,
    }),
    []
  );

  function updateColumn(idx: number, patch: Partial<UIColumn>) {
    setColumns((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function deleteColumn(idx: number) {
    setColumns((prev) => {
      const col = prev[idx];
      if (!col) return prev;

      // If it existed in DB, remember its ORIGINAL name for updateTable.deletedCols
      if (!col._isNew && col._originName) {
        setDeletedCols((d) => (d.includes(col._originName!) ? d : [...d, col._originName!]));
      }

      return prev.filter((_, i) => i !== idx);
    });
  }


  const defaultSuggestions = (col: UIColumn) => {
    const t = col.dtype?.toLowerCase();
    if (t === "uuid") {
      return [{ value: "uuid_generate_v4()", desc: "Generate a v4 UUID automatically for new rows." }];
    }
    if (t === "datetime" || t === "timestamp" || t === "timestamp with time zone") {
      return [{ value: "now()", desc: "Set the value to the current timestamp on insert." }];
    }
    return [];
  };

  const getCheckedOptions = (col: UIColumn) =>
    [col.isArray, col.isNullable, col.isUnique].filter((t) => t === true).length;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!table) throw new Error("No table loaded");

      const oldTable: TableType = table;

      // Build newTable (strip client-only metadata)
      const newTable: TableType = {
        name,
        columns: stripMeta(columns),
      };

      // Compute renamedCols from originName -> current name
      const renamedCols: { oldName: string; newName: string }[] = [];
      for (const c of columns) {
        if (c._isNew) continue;
        if (!c._originName) continue;
        if (deletedCols.includes(c._originName)) continue; // deleted wins
        if (c._originName !== c.name) {
          renamedCols.push({ oldName: c._originName, newName: c.name });
        }
      }

      return updateTable(projectId, schema, oldTable, newTable, renamedCols, deletedCols);
    },
    onMutate: () => toast.loading("Updating table...", { id: "update-table" }),
    onSuccess: () => {
      toast.success("Table updated successfully", { id: "update-table" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update table", { id: "update-table" });
    },
  });

  const disableSave =
    isPending ||
    tableLoading ||
    !table ||
    !name ||
    name.trim().length === 0 ||
    columns.length === 0;

  return (
    <>
      {/* Main editor */}
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto z-100 focus:outline-none overflow-x-hidden p-0! fullheight">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit {table?.name}</SheetTitle>
            <SheetDescription>Update columns and name</SheetDescription>
          </SheetHeader>
          <Separator />
          

          <div className="space-y-6 p-6 flex-1">
            <div className="flex flex-col gap-2">
              <h1>Name</h1>
              <Input value={name} onChange={(e) => setName(e.target.value)} id="table-name" />
            </div>

            <Separator />

            <div className="flex flex-col gap-6">
              <h1>Columns</h1>

              <div className="flex flex-col gap-1">
                <div className="fullwidth flex items-center pl-2 text-muted-foreground text-sm">
                  <h1 className="pr-25">Name</h1>
                  <h1 className="pr-32">Type</h1>
                  <h1 className="pr-16">Default Value</h1>
                  <h1>Primary Key</h1>
                </div>

                <div className="fullwidth flex flex-col gap-2">
                  {columns.map((col, idx) => {
                    const showDefaultMenu = defaultSuggestions(col).length > 0;

                    return (
                      <div
                        key={`${col._originName ?? "new"}:${idx}`}
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
                          onValueChange={(v) => updateColumn(idx, { dtype: v as DATA_TYPE_TYPE, default: "" })}
                        />

                        <div className="relative w-full">
                          <Input
                            value={col.default ?? ""}
                            onChange={(e) => updateColumn(idx, { default: e.target.value })}
                            placeholder="NULL"
                            className={`truncate ${showDefaultMenu ? "pr-10" : ""} focus-visible:ring-0 focus-visible:ring-offset-0`}
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

                                  {defaultSuggestions(col).map((s) => (
                                    <DropdownMenuItem
                                      key={s.value}
                                      onSelect={(e) => e.preventDefault()}
                                      className="flex flex-col items-start gap-1"
                                      onClick={() => updateColumn(idx, { default: s.value })}
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
                    );
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

            <Separator />

            <div className="flex flex-col gap-2">
              <h1>Foreign Keys</h1> 
            </div>
            
          </div>

          <div className="bg-black w-full overflow-hidden flex items-center justify-end sticky bottom-0 border-t gap-2 p-3 pr-6 h-18 min-h-18 max-h-18">
            <SheetClose asChild>
              <Button 
                variant={"secondary"}
                className="text-sm"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button 
              onClick={() => mutate()} 
              disabled={disableSave} 
              variant={"default"}
              size={"sm"}
              className="text-sm"
            >
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Update Table
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
              if (!table) return;

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