"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DatabaseObjectAddSheetProps,
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATION,
  TRIGGER_TYPE,
  TriggerType,
} from "@/lib/types";
import { getFunctions } from "@/lib/actions/database/functions/cache-actions";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { createTrigger, editTrigger } from "@/lib/actions/database/triggers";
import SheetWrapper from "@/components/SheetWrapper";

function EditTriggerSheet({
  projectId,
  editingTrigger,
  open,
  onOpenChange,
}: {
  editingTrigger: TriggerType,
  projectId: string,
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {

  const [name, setName] = useState(editingTrigger.name)


  const { mutate, isPending } = useMutation({
    mutationFn: () => editTrigger(
      editingTrigger,
      {
        ...editingTrigger,
        name
      }  
    , projectId),
    onSuccess: () => {
      toast.success("Trigger updated", { id: "update-trigger" });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update trigger", { id: "update-trigger" });
    },
    onMutate: () => { toast.loading("Updating...", { id: "update-trigger" }) }
  });

  return (
    <SheetWrapper
      title="Edit Trigger"
      onSubmit={() => mutate()}
      disabled={name === editingTrigger.name || !name}
      isDirty={() => name !== editingTrigger.name}
      onOpenChange={onOpenChange}
      open={open}
      onDiscard={() => {
        setName(editingTrigger.name)
      }}
      submitButtonText="Apply Changes"
      isPending={isPending}
    >
      <div className='flex flex-col gap-2'>
        <h1>Name</h1>
        <Input 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='e.g. user_email'
          id='column-name'
        />
      </div>
    </SheetWrapper>     
  )
}

export default EditTriggerSheet;