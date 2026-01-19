"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "@/components/DeleteDialog";
import { useState } from "react";
import { PlayCircleIcon, EllipsisVerticalIcon, EditIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { deleteTrigger } from "@/lib/actions/database/triggers";
import { TriggerType } from "@/lib/types";
import EditTriggerSheet from "../sheets/EditTriggerSheet";

const TriggerCard = ({
  name,
  table_name,
  schema_name,
  function_name,
  events,
  timing,
  orientation
}: TriggerType) => {

  const pathname = usePathname()
  const projectId = pathname.split("/")[2]
  
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
            <div className="flex items-center gap-2">
              <PlayCircleIcon className="h-6 w-6 text-muted-foreground" />
              <h3 className="font-semibold text-2xl truncate">{name}</h3>
            </div>

            <p className="text-xs text-muted-foreground mt-1 truncate">
              <span className="text-muted-foreground text-lg">{`public`}.<span className="text-black dark:text-white">{table_name}</span></span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
                "text-muted-foreground bg-muted/30",
                "group-hover:text-foreground group-hover:border-foreground/20"
              )}
            >
              {function_name}
            </span>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"}><EllipsisVerticalIcon /></Button>
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
          <p className="text-xs text-muted-foreground">Events</p>
          <p className="mt-1 font-mono text-xs text-foreground/90 truncate">
            {events}
          </p>
        </div>
      </div>

      <EditTriggerSheet 
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        projectId={projectId}
        editingTrigger={{
          events,
          function_name,
          name,
          orientation,
          schema_name,
          table_name,
          timing
        }}
      />
      <DeleteDialog
        toBeDeleted="Trigger"
        deleteFunction={deleteTrigger}
        name={name}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        projectId={projectId}
        schema={schema_name}
        table={table_name}
      />
    </>
  );
};

export default TriggerCard;