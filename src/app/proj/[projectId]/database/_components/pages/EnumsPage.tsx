"use client";

import { Separator } from "@/components/ui/separator";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { useEffect, useMemo, useRef, useState } from "react";
import SchemaPicker from "../SchemaPicker";
import { Input } from "@/components/ui/input";
import { InboxIcon, Search, BookTypeIcon, EllipsisVerticalIcon, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AddEnumSheet from "../sheets/AddEnumSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../dialogs/DeleteDialog";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { renameEnum, renameEnumValue, addValueToEnum, deleteEnum } from "@/lib/actions/database/enums";

type Props = {
  projectId: string;
  enums: any[];
  schemas: any[]
};

const EnumsPage = ({ projectId, schemas, enums }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const { schema, setSchema } = useSelectedSchema({
    projectId,
    schemas,
    persist: true,
  });

  useEffect(() => {
    if (!schema && schemas && schemas.length > 0) {
      setSchema(schemas[0]);
    }
  }, [schemas, schema, setSchema]);


  const filteredEnums = useMemo(() => {
    if (!enums) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return enums;

    return enums.filter((f) =>
      f.function_name.toLowerCase().includes(q)
    );
  }, [searchTerm, enums]);

  const showEmptySchemaState = !searchTerm && (enums?.length ?? 0) === 0;
  const showNoMatchesState = !!searchTerm && filteredEnums.length === 0;

  return (
    <div className="fullscreen flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl">Enumerated Types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enums are lists of possible values for a data point.
          </p>
        </div>

        <AddEnumSheet
          open={open}
          onOpenChange={setOpen}
          projectId={projectId}
          schemas={schemas ?? []}
          hideTrigger={false}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 mb-4 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full sm:w-72"
              placeholder="Search enums"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <SchemaPicker schemas={schemas ?? []} value={schema} onChange={setSchema} />
        </div>

        <div className="text-xs text-muted-foreground">
          {`${filteredEnums.length} enums${filteredEnums.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* CONTENT */}
      {showEmptySchemaState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <InboxIcon size={96} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">No enums in “{schema}”</h2>
            <p className="text-muted-foreground text-sm">
              Create your first enum to apply static typing in your databases
            </p>
          </div>

          <AddEnumSheet
            open={open}
            onOpenChange={setOpen}
            projectId={projectId}
            schemas={schemas ?? []}
            hideTrigger={false}
          />
        </div>
      ) : showNoMatchesState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Search size={72} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">No matches</h2>
            <p className="text-muted-foreground text-sm">
              No enums match “{searchTerm.trim()}”.
            </p>
          </div>
          <Button
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {filteredEnums.map((f: any) => (
            <EnumCard
              key={Math.random()}
              name={f.enum_name}
              values={f.enum_values}
              schema={f.enum_schema}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnumsPage;

const EnumCard = ({
  name,
  values,
  schema,
}: {
  name: string;
  values: string;
  schema: string;
}) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!nameInputRef.current) return;
    nameInputRef.current.focus();
  }, [isEditingName]);

  // ---------------------------
  // Values UI state
  // ---------------------------
  const parsedValues = useMemo(() => {
    // supports "a, b, c" and also "{a,b,c}" style if you ever pass that
    const raw = values.trim();
    const cleaned =
      raw.startsWith("{") && raw.endsWith("}")
        ? raw.slice(1, -1)
        : raw;

    return cleaned
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }, [values]);

  // map original -> current edited text
  const [editedMap, setEditedMap] = useState<Record<string, string>>({});

  // new value input
  const [newValue, setNewValue] = useState("");

  // initialize / refresh map when values change externally
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const v of parsedValues) next[v] = v;
    setEditedMap(next);
  }, [parsedValues]);

  const handleSave = async (props: {
    newName?: string;
    addValue?: string;
    oldValue?: string;
    newValue?: string;
  }) => {
    try {
      if (props.newName) {
        await renameEnum(projectId, schema, name, props.newName);
      } else if (props.oldValue && props.newValue) {
        await renameEnumValue(projectId, schema, name, props.oldValue, props.newValue);
      } else if (props.addValue) {
        await addValueToEnum(projectId, schema, name, props.addValue);
      } else {
        throw new Error("Invalid handleSave props");
      }

      toast.success("Enum updated successfully", { id: "update-enum" });
    } catch (error) {
      toast.error(
        `Failed to update ${name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "update-enum" }
      );
    }
  };

  const anyRenameChanges = useMemo(() => {
    return parsedValues.some((v) => (editedMap[v] ?? v) !== v);
  }, [parsedValues, editedMap]);

  const canAdd = newValue.trim().length > 0 && !parsedValues.includes(newValue.trim());

  return (
    <div
      className={cn(
        "group rounded-xl border bg-background p-4",
        "transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-foreground/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="group flex items-center gap-2">
            <BookTypeIcon className="h-6 w-6 text-muted-foreground" />
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() => {
                  setIsEditingName(false);
                  setEditedName(name);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave({ newName: editedName });
                }}
              />
            ) : (
              <h3 className="font-semibold text-2xl truncate">{name}</h3>
            )}

            <Button
              onClick={() => setIsEditingName((p) => !p)}
              variant={"ghost"}
              className={`text-muted-foreground opacity-0 ${
                !isEditingName && "group-hover:opacity-100"
              } transition-opacity duration-200 cursor-pointer`}
            >
              <PencilIcon />
            </Button>
          </div>

          <p className="text-lg text-muted-foreground mt-1 truncate">
            <span className="font-mono">{schema}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"}>
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <DeleteDialog
                  toBeDeleted="Enum"
                  deleteFunction={deleteEnum}
                  name={name}
                  projectId={projectId}
                  schema={schema}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ---------------------------
          Values editor
        --------------------------- */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Values</p>

          {/* Save-all renames button (optional but intuitive) */}
          <Button
            size="sm"
            variant="secondary"
            disabled={!anyRenameChanges}
            onClick={async () => {
              // rename values one-by-one (PG enum rename is per value)
              for (const oldVal of parsedValues) {
                const nextVal = (editedMap[oldVal] ?? oldVal).trim();
                if (nextVal && nextVal !== oldVal) {
                  // eslint-disable-next-line no-await-in-loop
                  await handleSave({ oldValue: oldVal, newValue: nextVal });
                }
              }
            }}
          >
            Save changes
          </Button>
        </div>

        {/* Existing values (rename only) */}
        <div className="mt-2 space-y-2">
          {parsedValues.map((oldVal) => {
            const current = editedMap[oldVal] ?? oldVal;
            const changed = current.trim() !== oldVal;

            return (
              <div key={oldVal} className="flex items-center gap-2">
                <Input
                  value={current}
                  onChange={(e) =>
                    setEditedMap((m) => ({ ...m, [oldVal]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && changed) {
                      const nextVal = current.trim();
                      if (!nextVal) return;
                      handleSave({ oldValue: oldVal, newValue: nextVal });
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Add new value */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Add value</p>
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="e.g. archived"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  const v = newValue.trim();
                  handleSave({ addValue: v });
                  setNewValue("");
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!canAdd}
              onClick={() => {
                const v = newValue.trim();
                handleSave({ addValue: v });
                setNewValue("");
              }}
            >
              Add
            </Button>
          </div>

          {/* tiny hint if they typed a duplicate */}
          {!canAdd && newValue.trim().length > 0 && parsedValues.includes(newValue.trim()) && (
            <p className="mt-1 text-xs text-muted-foreground">
              That value already exists.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

