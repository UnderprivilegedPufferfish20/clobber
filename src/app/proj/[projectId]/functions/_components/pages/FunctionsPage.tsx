'use client';

import { Separator } from "@/components/ui/separator";
import { useSelectedSchema } from "@/hooks/useSelectedSchema";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { InboxIcon, Search, BookTypeIcon, EllipsisVerticalIcon, PencilIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteDialog from "../../../database/_components/dialogs/DeleteDialog";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { EdgeFunctionType } from "@/lib/types";
import AddFunctionSheet from "../../../database/_components/sheets/AddFunctionSheet";
import Link from "next/link";

type Props = {
  projectId: string;
  functions: EdgeFunctionType[]
};

const EdgeFunctionsPage = ({ projectId, functions}: Props) => {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const setNewPage = () => {
        const sp = new URLSearchParams(searchParams)
        sp.append("new", "true")
        return sp
    }

  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);



  const filteredFuncs = useMemo(() => {
    if (!functions) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return functions;

    return functions.filter((f) =>
      f.slug.toLowerCase().includes(q)
    );
  }, [searchTerm, functions]);

  const showNoMatchesState = !!searchTerm && filteredFuncs.length === 0;

  return (
    <div className="fullscreen flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl">Edge Functions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deploy serverless, scalable, and efficient functions that live on the cloud close to your users
          </p>
        </div>

        <Link
            className="flex items-center gap-2"
            href={`${pathname}?${setNewPage()}`}
        >
            <PlusIcon className="w-6 h-6" />
            Create Edge Functions
        </Link>
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
        </div>

        <div className="text-xs text-muted-foreground">
          {`${filteredFuncs.length} enums${filteredFuncs.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* CONTENT */}
      {showNoMatchesState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Search size={72} className="text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">No matches</h2>
            <p className="text-muted-foreground text-sm">
              No edge functions match “{searchTerm.trim()}”.
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
          {filteredFuncs.map((f: any) => (
            <FunctionCard
              func={f}
            />
          ))}
        </div>
      )}    
    </div>
  );
};

export default EdgeFunctionsPage;

const FunctionCard = ({
    func
}: {
    func: EdgeFunctionType
}) => {
    return (
        <p>{func.slug}</p>
    )
}

