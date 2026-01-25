"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Table2Icon,
  Link2Icon,
  EllipsisVerticalIcon,
  XIcon,
  MenuIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DATA_TYPES,
  FkeyType,
  type ColumnType,
  type TableType,
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
import DefaultValueSelector from "../selectors/DefaultValueSelector";
import SheetWrapper from "@/components/SheetWrapper";
import AddFkeySheet from "./AddFkeySheet";
import EditFkeySheet from "./EditFkeySheet";


type EditableColumn = ColumnType & { originalName: string | null };

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
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const emptyColumn: EditableColumn = {
    name: "",
    dtype: DATA_TYPES.INTEGER,
    isArray: false,
    default: undefined,
    isPkey: false,
    isUnique: false,
    isNullable: true,
    originalName: null,
  };

  const [columns, setColumns] = useState<EditableColumn[]>(
    table.columns.map(c => ({ ...c, originalName: c.name }))
  );

  const [name, setName] = useState(table.name);

  const [fkeys, setFkeys] = useState<FkeyType[]>(table.fkeys ?? []);

  const [isFkeySheetOpen, setIsFkeySheetOpen] = useState(false);

  const [isEditFkeySheetOpen, setIsEditFkeySheetOpen] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateTable(
        projectId,
        schema,
        table,
        {
          name,
          columns,
          fkeys
        }
      ),
    onSuccess: () => {
      toast.success("Table updated successfully", { id: "edit-table" });
      onOpenChange(false);
    },
    onMutate() {
      toast.loading("Updating Table...", { id: "edit-table" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to edit table", { id: "edit-table" });
    }
  });

  function updateColumn(idx: number, patch: Partial<ColumnType>) {
    setColumns((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  function deleteColumn(idx: number) {
    setColumns((prev) => prev.filter((_, i) => i !== idx));
  }

  const getCheckedOptions = (col: EditableColumn) => {
    return [col.isArray, col.isNullable, col.isUnique].filter(t => t === true).length;
  };

  const isDirty = useMemo(() => {
    const cleanedColumns = columns.map(({ originalName, ...c }) => c);
    return (
      name !== table.name ||
      JSON.stringify(cleanedColumns) !== JSON.stringify(table.columns) ||
      JSON.stringify(fkeys) !== JSON.stringify(table.fkeys ?? [])
    );
  }, [name, columns, fkeys, table.name, table.columns, table.fkeys]);

  const getDefaultForType = (dtype: DATA_TYPES) => {
    switch (dtype) {
      case "uuid":
        return "uuid_generate_v4()";
      case "timestamp":
        return "now()";
      default:
        return "";
    }
  };

  return (
    <>
      <SheetWrapper
        title={`Edit ${table.name}`}
        description={`Change properties of ${table.name}`}
        submitButtonText="Apply Changes"
        onOpenChange={onOpenChange}
        open={open}
        onSubmit={() => mutate()}
        isPending={isPending}
        isDirty={() => isDirty}
        disabled={columns.length === 0 || !name}
        onDiscard={() => {
          setName(table.name);
          setColumns(table.columns.map(c => ({ ...c, originalName: c.name })));
          setFkeys(table.fkeys ?? []);
        }}
      >
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
                      key={`col:${idx}`}
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
                        onValueChange={(v) => updateColumn(idx, { dtype: v as DATA_TYPES, default: getDefaultForType(v as DATA_TYPES) })}
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

        <div className='flex flex-col gap-1'>
          <h1 className='mb-5'>Foreign Keys</h1>

          {fkeys.map((fkey, idx) => (
            <div
              key={idx}
              className={`flex flex-col fullwidth p-2 relative rounded-md border border-border`}
            >
              <div className='flex gap-1 items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Table2Icon className='w-4 h-4' />
                  <h2 className='text-md text-muted-foreground'>
                    {fkey.cols[0]!.referenceeSchema}.
                    <span className='text-white'>{fkey.cols[0]!.referenceeTable}</span>
                  </h2>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant={"outline"} 
                    onClick={() => setFkeys(p => p.filter((_, i) => i !== idx))}
                  >
                    Delete
                  </Button>
                  <Button
                    variant={"outline"}
                    onClick={() => setIsEditFkeySheetOpen({ open: true, index: idx })}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className='ml-6 flex w-fit flex-col gap-1 text-sm'>
                {fkey.cols.map(c => (
                  <div className='flex items-center justify-between p-1'>
                    <span className='text-muted-foreground'>{c.referencorColumn}</span>
                    <ArrowRightIcon className='w-4 h-4 mx-1' />
                    <span className='text-white'>{c.referenceeColumn}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
              className={`flex items-center justify-center fullwidth relative rounded-md border border-dashed border-border py-2 mt-2`}
            >
            <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setIsFkeySheetOpen(true)}>
              Add Foreign Key
            </Button>
          </div>
        </div>

      </SheetWrapper>

      <AddFkeySheet 
        projectId={projectId}
        setFkeys={setFkeys}
        table={{ name, columns }}
        open={isFkeySheetOpen}
        onOpenChange={setIsFkeySheetOpen}
        schema={schema}
      />

      <EditFkeySheet 
        editingFkey={
          typeof isEditFkeySheetOpen.index === "number"
            ? fkeys[isEditFkeySheetOpen.index]
            : undefined
        }
        open={isEditFkeySheetOpen.open}
        index={isEditFkeySheetOpen.index ?? undefined}
        onOpenChange={() => setIsEditFkeySheetOpen({ open: false, index: null })}
        projectId={projectId}
        schema={schema}
        table={table}
        setFkeys={setFkeys}
      />
    </>
  );
}

export default EditTableSheet;