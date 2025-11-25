'use client'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileJsonIcon, FileSpreadsheetIcon, ListEndIcon, ListPlusIcon, PlusCircleIcon } from "lucide-react";
import { AddColumnSheet } from "./AddColumnSheet";
import { useState } from "react";

export default function AddToTable() {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <PlusCircleIcon size={36}/>
          Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">

        <DropdownMenuGroup>
          <DropdownMenuItem>
            Add row
            <DropdownMenuShortcut><ListEndIcon size={36} /></DropdownMenuShortcut>
          </DropdownMenuItem>

          <AddColumnSheet
    trigger={
    <DropdownMenuItem 
      onSelect={(e) => {
        e.preventDefault(); // Prevents the dropdown from closing
      }}
    >
      Add Column
      <DropdownMenuShortcut><ListPlusIcon size={36}/></DropdownMenuShortcut>
    </DropdownMenuItem>
    }
    />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Import</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  JSON
                  <DropdownMenuShortcut><FileJsonIcon size={36}/></DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  CSV
                  <DropdownMenuShortcut><FileSpreadsheetIcon size={36}/></DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


