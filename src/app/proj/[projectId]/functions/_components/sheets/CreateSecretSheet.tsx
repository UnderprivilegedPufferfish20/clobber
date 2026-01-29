"use client"

import SheetWrapper from "@/components/SheetWrapper"
import { Input } from "@/components/ui/input"
import { createSecret } from "@/lib/actions/functions/secrets"
import { useMutation } from "@tanstack/react-query"
import { Dispatch, SetStateAction, useState } from "react"
import { toast } from "sonner"

export default function CreateSecretSheet({
    open,
    onOpenChange,
    projectId
}: {
    open: boolean,
    onOpenChange: Dispatch<SetStateAction<boolean>>,
    projectId: string
}) {
    const [key, setKey] = useState('')
    const [value, setValue] = useState("")

    const { mutate: add, isPending } = useMutation({
        mutationFn: () => createSecret({
            createdAt: new Date().toLocaleDateString(),
            name: key,
            value,
            updatedAt: new Date().toLocaleDateString(),
        }, projectId),
        onMutate: () => toast.loading("Creating...", { id:"create-secret" }),
        onError: (e) => toast.error(`Failed to create secret: ${e}`, { id:"create-secret" }),
        onSuccess: () => toast.success("Secret Created", { id:"create-secret" })
    })

    return (
        <SheetWrapper
            open={open}
            disabled={!key || !value}
            onSubmit={() => add()}
            submitButtonText="Create Secret"
            title="Create Secret"
            onDiscard={() => {
                setKey("")
                setValue("")
            }}
            isDirty={() => Boolean(key || value)}
            isPending={isPending}

            onOpenChange={onOpenChange}
        >
            <div className="flex flex-col gap-2">
                <h1>Key</h1>
                <Input 
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    className="w-full"
                    placeholder="Name of secret"
                />
            </div>

            <div className="flex flex-col gap-2">
                <h1>Value</h1>
                <Input 
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full"
                    placeholder="paste value here"
                />
            </div>
        </SheetWrapper>
    )
}