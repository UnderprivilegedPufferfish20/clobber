"use client";

import type * as monacoType from "monaco-editor";
import React, { useEffect, useRef, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "@/components/DeleteDialog";
import { Input } from "@/components/ui/input";
import { FunctionSquare, EllipsisVerticalIcon, PencilIcon, ChevronsUpDown, EditIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Editor } from "@monaco-editor/react";
import { toast } from "sonner";
import { Popover } from "@/components/ui/popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { editFunction, deleteFunction } from "@/lib/actions/database/functions";
import { DATA_TYPES, DatabaseFunctionType } from "@/lib/types";
import EditFunctionSheet from "../sheets/EditFunctionSheet";

const FunctionCard = ({
  schema_name,
  function_name,
  return_type,
  arguments: args,
  definition
}: DatabaseFunctionType) => {
  let sig = `${function_name}(${args || ""})`;
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)



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
              <FunctionSquare className="h-6 w-6 text-muted-foreground" />
                <h3 
                  className="font-semibold text-2xl truncate"
                >
                  {function_name}
                </h3>
            </div>

            

            <div className="group flex items-center gap-2">
              
                <p className="text-lg text-muted-foreground mt-1 truncate">
                  <span className="font-mono">{schema_name}</span>
                </p>
            
            </div>

          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
                "text-muted-foreground bg-muted/30",
                "group-hover:text-foreground group-hover:border-foreground/20"
              )}
            >
              {return_type}
            </span>

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
                  <EditIcon className="w-4 h-4"/>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2Icon className="w-4 h-4"/>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xl">Parameters</p>
          <div className="flex text-sm text-muted-foreground mt-2">
            <p className="mr-48">Name</p>
            <p>Data Type</p>
          </div>
          <div className="mt-1 font-mono text-xs text-foreground/90 truncate flex flex-col gap-2">
            {sig
              .split("(")[1]
              .split(", ")
              .map((arg) => {
                if (arg.includes(")")) arg = arg.split(")")[0];
                if (arg === "") return <p className="text-muted-foreground" key={Math.random()}>No parameters</p>;
                return (
                  <div key={Math.random()} className="flex items-center gap-2 w-md">
                    <Input value={arg.split(" ")[0]} disabled className="cursor-not-allowed" />
                    <Input value={arg.split(" ")[1]} disabled className="cursor-not-allowed" />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <EditFunctionSheet 
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        projectId={projectId}
        editingFunction={{ arguments: args, return_type, definition: definition, function_name, schema_name }}
      />
      <DeleteDialog
        toBeDeleted="Function"
        deleteFunction={deleteFunction}
        name={sig}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        projectId={projectId}
        schema={schema_name}
      />
    </>
  );
};

export default FunctionCard;