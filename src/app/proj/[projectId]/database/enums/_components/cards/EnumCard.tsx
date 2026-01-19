"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { BookTypeIcon, EditIcon, EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "@/components/DeleteDialog";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { EnumType } from "@/lib/types";
import { deleteEnum } from "@/lib/actions/database/enums";
import EditEnumSheet from "../sheets/EditEnumSheet";

const EnumCard = ({
  enum_name,
  enum_values,
  enum_schema,
}: EnumType) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [dropdownOpen, setDropdownOpen] = useState(false);


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

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)


  return (
    <>
    
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
                <h3 className="font-semibold text-2xl truncate">{enum_name}</h3>
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
                  className="flex items-center gap-2"
                  onClick={() => setIsEditOpen(true)}
                >
                  <EditIcon className="h-4 w-4"/>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2Icon className="h-4 w-4"/>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


          {/* Existing values (rename only) */}
          <div className="mt-2 space-y-2">
            {parsedValues.map((oldVal) => {
              return (
                <div key={oldVal} className="flex items-center gap-2">
                  <Input
                    value={oldVal}
                    disabled
                    className="cursor-not-allowed"
                  />
                </div>
              );
            })}
        </div>
      </div>

      <DeleteDialog
        toBeDeleted="Enum"
        deleteFunction={deleteEnum}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        name={enum_name}
        projectId={projectId}
        schema={enum_schema}
      />

      <EditEnumSheet 
        projectId={projectId}
        editingEnum={{ enum_name, enum_values, enum_schema }}
        onOpenChange={setIsEditOpen}
        open={isEditOpen}
      />
    </>
  );
};

export default EnumCard;