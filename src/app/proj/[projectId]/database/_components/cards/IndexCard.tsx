"use client";

import { useState } from "react";
import { ListTreeIcon, EllipsisVerticalIcon } from "lucide-react";
import { INDEX_TYPES, IndexType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../DeleteDialog";
import { deleteIndex } from "@/lib/actions/database/indexes";

const IndexCard = ({
  schema_name,
  table_name,
  index_name,
  access_method,
  index_definition,
  is_unique,
  is_primary
}: IndexType) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const pathname = usePathname();

  const projectId = pathname.split("/")[2]

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
          <div className="flex items-center gap-2">
            <ListTreeIcon className="h-6 w-6 text-muted-foreground" />
            <h3 className="font-semibold text-2xl truncate">{index_name}</h3>
          </div>


          
          <p className="text-xs text-muted-foreground mt-2 truncate">
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
            {access_method.toString()}
          </span>

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"}><EllipsisVerticalIcon /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={e => {
                e.preventDefault()
              }}>
                <DeleteDialog
                  toBeDeleted="Index"
                  deleteFunction={deleteIndex} 
                  name={index_name}
                  projectId={projectId}
                  schema={"public"}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>

      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Preview</p>
        <p className="mt-1 font-mono text-xs text-foreground/90 truncate">
          {index_definition}
        </p>
      </div>
    </div>
  );
};

export default IndexCard;
