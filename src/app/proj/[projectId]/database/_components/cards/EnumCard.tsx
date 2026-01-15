"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { BookTypeIcon, EllipsisVerticalIcon, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../../../../../../components/DeleteDialog";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { renameEnum, renameEnumValue, addValueToEnum, deleteEnum } from "@/lib/actions/database/enums";
import { EnumType } from "@/lib/types";

const EnumCard = ({
  enum_name,
  enum_values,
  enum_schema,
}: EnumType) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(enum_name);

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
    const raw = enum_values.trim();
    const cleaned =
      raw.startsWith("{") && raw.endsWith("}")
        ? raw.slice(1, -1)
        : raw;

    return cleaned
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }, [enum_values]);

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
        await renameEnum(projectId, enum_schema, enum_name, props.newName);
      } else if (props.oldValue && props.newValue) {
        await renameEnumValue(projectId, enum_schema, enum_name, props.oldValue, props.newValue);
      } else if (props.addValue) {
        await addValueToEnum(projectId, enum_schema, enum_name, props.addValue);
      } else {
        throw new Error("Invalid handleSave props");
      }

      toast.success("Enum updated successfully", { id: "update-enum" });
    } catch (error) {
      toast.error(
        `Failed to update ${enum_name}: ${
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
                  setEditedName(enum_name);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave({ newName: editedName });
                }}
              />
            ) : (
              <h3 className="font-semibold text-2xl truncate">{enum_name}</h3>
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
            <span className="font-mono">{enum_schema}</span>
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
                  name={enum_name}
                  projectId={projectId}
                  schema={enum_schema}
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

export default EnumCard;