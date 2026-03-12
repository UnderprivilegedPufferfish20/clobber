"use client";

import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { add_team_member } from "@/lib/actions/database/actions";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { fa } from "zod/v4/locales";

const AddTeamMemberDialog = ({
    iid,
    user_id
}: {
    iid:string,
    user_id: string
}) => {
    const [emails, setEmails] = useState<string[]>([""])
    const [open, setOpen] = useState(false)

    const { mutate: inv, isPending} = useMutation({
        mutationFn: () => add_team_member(iid, emails, user_id),
        onMutate: () => toast.loading("Inviting...", { id: "inv" }),
        onSuccess: () => {
            toast.success("Invite Successful", { id: "inv" });
            setOpen(false)
        },
        onError: (e) => toast.error(`Failed to invite: ${e}`, {id: "inv"})
    })

    useEffect(() => {
        if (open === false) {
            setEmails([''])
        }
    }, [open])

  return (
    <Dialog
        onOpenChange={setOpen}
        open={open}
    >
        <DialogTrigger asChild>
            <Button
                className="flex items-center gap-2"
                variant={"default"}
                disabled={isPending}
            >
                <PlusIcon className="w-5 h-5"/>
                Add Team Member
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader className="pb-6">
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                    invite someone to access this project
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center fullwidth justify-between border-b-2 pb-2">
                <p>Emails</p>
                <Button
                    size={"icon"}
                    variant={"outline"}
                    onClick={() => setEmails(p => [...p, ""])}
                    disabled={isPending}
                >
                    <PlusIcon className="w-4 h-4"/>
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                {emails.map((_, idx) => (
                    <div className="fullwidth flex items-center gap-2">
                        <Input 
                            disabled={isPending}
                            placeholder="Email"
                            value={emails[idx]}
                            onChange={e => {
                                setEmails(prevItems => 
                                    prevItems.map((item, i) => (i === idx ? e.target.value : item))
                                );
                            }}
                        />
                        <Button
                            size={"icon"}
                            variant={"ghost"}
                            onClick={() => setEmails(p => p.filter((_,i) => i !== idx))}
                            disabled={isPending}
                        >
                            <Trash2Icon className="w-4 h-4"/>
                        </Button>
                    </div>
                ))}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        variant={"secondary"}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                </DialogClose>
                <Button
                    variant={"default"}
                    onClick={() => inv()}
                    disabled={isPending}
                >
                    Invite
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}

export default AddTeamMemberDialog