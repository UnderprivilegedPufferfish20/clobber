"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table2Icon,
  EllipsisVerticalIcon,
  XIcon,
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
import { Badge } from "@/components/ui/badge";
import { updateTable } from "@/lib/actions/database/tables";
import DataTypeSelect from "../DataTypeSelect";
import DefaultValueSelector from "../selectors/DefaultValueSelector";
import SheetWrapper from "@/components/SheetWrapper";
import AddFkeySheet from "./AddFkeySheet";
import EditFkeySheet from "./EditFkeySheet";


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
  const emptyColumn = {
    name: "",
    dtype: DATA_TYPES.INTEGER,
    is_array: false,
    default: "",
    is_pkey: false,
    is_unique: false,
    is_nullable: true,
  };
  const originalColumnStringsSet = new Set(table.columns.map(c => JSON.stringify(c)))

  

  const [updatedColumns, setUpdatedColumns] = useState<{ old: string, new: string }[]>([])
  const [deletedCols, setDeletedCols] = useState<string[]>([])
  const [newCols, setNewCols] = useState<string[]>([])

  const [columns, setColumns] = useState<ColumnType[]>(table.columns);

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
        },
        updatedColumns,
        deletedCols,
        newCols
      ),
    onSuccess: () => {
      toast.success("Table updated successfully", { id: "edit-table" });
      onOpenChange(false);
      setUpdatedColumns([]);
      setDeletedCols([]);
      setNewCols([]);
    },
    onMutate() {
      toast.loading("Updating Table...", { id: "edit-table" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to edit table", { id: "edit-table" });
      setUpdatedColumns([]);
      setDeletedCols([]);
      setNewCols([]);
    }
  });

  const updatedColsNews = useMemo(() => {
    return new Set(updatedColumns.map(uc => uc.new))
  }, [updatedColumns])

  const newColsSet = useMemo(() => {
    return new Set(newCols)
  }, [newCols])

  function updateColumn(idx: number, patch: Partial<ColumnType>) {
    if (originalColumnStringsSet.has(JSON.stringify(columns[idx]))) {
      setUpdatedColumns(p => [...p, { old: JSON.stringify(columns[idx]), new: JSON.stringify({ ...columns[idx], ...patch }) }])
    } else if (updatedColsNews.has(JSON.stringify(columns[idx]))) {
      const indexOfUpdated = updatedColumns.indexOf(updatedColumns.find(uc => uc.new === JSON.stringify(columns[idx]))!)
      const currentNew = JSON.parse(updatedColumns[indexOfUpdated].new)

      const newUpdatedColum = { ...currentNew, ...patch }

      console.log("@NEW UPDATED COL: ", newUpdatedColum)

      updatedColumns[indexOfUpdated].new = JSON.stringify(newUpdatedColum)
      setUpdatedColumns([...updatedColumns])
    }

    if (newColsSet.has(JSON.stringify(columns[idx]))) {
      console.log("@@ NEW COLS: ", newCols.map(nc => JSON.parse(nc)))
      const indexOfUpdated = newCols.indexOf(newCols.find(nc => JSON.stringify(columns[idx]) === nc)!)
      console.log("@@UPDATE @ IDX: ", newCols[indexOfUpdated])
      newCols[indexOfUpdated] = JSON.stringify({ ...JSON.parse(newCols[indexOfUpdated]), ...patch })
      setNewCols([...newCols])
    }

    setColumns((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  function deleteColumn(idx: number) {
    if (originalColumnStringsSet.has(JSON.stringify(columns[idx])) || updatedColsNews.has(JSON.stringify(columns[idx]))) {
      setDeletedCols(p => Array.from(new Set([...p, columns[idx].name])))
    } else if (newColsSet.has(JSON.stringify(columns[idx]))) {
      setNewCols(p => p.filter(nc => nc !== JSON.stringify(columns[idx])))
    }

    setColumns((prev) => prev.filter((_, i) => i !== idx));
  }

  const getCheckedOptions = (col: ColumnType) => {
    return [col.is_array, col.is_nullable, col.is_unique].filter(t => t === true).length;
  };

  const isDirty = useMemo(() => {
    return (
      name !== table.name ||
      JSON.stringify(columns) !== JSON.stringify(table.columns) ||
      JSON.stringify(fkeys) !== JSON.stringify(table.fkeys ?? [])
    );
  }, [name, columns, fkeys, table]);

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

  useEffect(() => {
    if (open) {
      setColumns(table.columns);
      setName(table.name);
      setFkeys(table.fkeys ?? []);
      // Reset tracking state
      setUpdatedColumns([]);
      setDeletedCols([]);
      setNewCols([]);
    }
  }, [open, table]);


  return (
    <>
      <SheetWrapper
        title={`Edit ${table.name}`}
        description={`Change properties of ${table.name}`}
        submitButtonText="Apply Changes"
        sheetContentClassname="w-4xl! min-w-4xl! max-w-4xl"
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
              <h1 className="pr-42">Name</h1>
              <h1 className="pr-42">Type</h1>
              <h1 className="pr-36">Default Value</h1>
              <h1>Primary Key</h1>
            </div>

            <div className='fullwidth flex flex-col gap-1'>
              {columns.map((col, idx) => {

                const updateDefault = (value: string) => {
                  updateColumn(idx, { default: value });
                };

                console.log("@COL: ", col)

                return (
                    <div
                      key={`col:${idx}`}
                      className={`${col.is_pkey && "bg-white/5"} flex items-center gap-2 fullwidth p-2 relative rounded-md border border-border`}
                    >

                      

                      <Input
                        value={col.name}
                        onChange={(e) => updateColumn(idx, { name: e.target.value })}
                        className="focus-visible:ring-0 focus-visible:ring-offset-0 max-w-48 min-w-48 w-48"
                      />

                      <DataTypeSelect
                        triggerClassname="max-w-48 min-w-48 w-48 truncate" 
                        value={col.dtype}
                        onValueChange={(v) => updateColumn(idx, { dtype: v as DATA_TYPES, default: getDefaultForType(v as DATA_TYPES) })}
                      />
                      
                      <DefaultValueSelector 
                        defaultValue={col.default}
                        isArray={col.is_array}
                        dtype={col.dtype}
                        setDefaultValue={updateDefault}
                        className='truncate focus-visible:ring-0 focus-visible:ring-offset-0'
                      />

                      <Checkbox
                        className={`w-6 h-6 ${col.is_pkey ? "mr-30" : "mr-18"}`}
                        checked={col.is_pkey}
                        onCheckedChange={(v) => updateColumn(idx, { is_pkey: Boolean(v), is_array: false })}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className={`${col.is_pkey && "hidden"} relative`} type="button">
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
                              checked={col.is_nullable}
                              onCheckedChange={(v) => updateColumn(idx, { is_nullable: Boolean(v) })}
                            />
                            <Label htmlFor={`isNullable-${idx}`}>Is Nullable</Label>
                          </DropdownMenuItem>

                          <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                            <Checkbox
                              id={`isUnique-${idx}`}
                              checked={col.is_unique}
                              onCheckedChange={(v) => updateColumn(idx, { is_unique: Boolean(v) })}
                            />
                            <Label htmlFor={`isUnique-${idx}`}>Is Unique</Label>
                          </DropdownMenuItem>

                          {!col.is_pkey && (
                            <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                              <Checkbox
                                id={`isArray-${idx}`}
                                checked={col.is_array}
                                onCheckedChange={(v) => updateColumn(idx, { is_array: Boolean(v) })}
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
              <Button 
                variant="secondary" 
                className="max-w-3xs" 
                type="button" 
                onClick={() => {
                  const newCol: ColumnType = { ...emptyColumn }; // fresh object
                  setNewCols(p => [...p, JSON.stringify(newCol)]);
                  setColumns(p => [...p, newCol]);
                }}
              >
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
                    {fkey.cols[0]!.referencee_schema}.
                    <span className='text-white'>{fkey.cols[0]!.referencee_table}</span>
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
                  <div key={Math.random()} className='flex items-center justify-between p-1'>
                    <span className='text-muted-foreground'>{c.referencor_column}</span>
                    <ArrowRightIcon className='w-4 h-4 mx-1' />
                    <span className='text-white'>{c.referencee_column}</span>
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