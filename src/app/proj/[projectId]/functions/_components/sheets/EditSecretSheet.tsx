"use client"

import SheetWrapper from "@/components/SheetWrapper"
import { Input } from "@/components/ui/input"
import { createSecret, updateSecret } from "@/lib/actions/functions/secrets"
import { useMutation } from "@tanstack/react-query"
import { Dispatch, SetStateAction, useState } from "react"
import { toast } from "sonner"

export default function EditSecretSheet({
    open,
    onOpenChange,
    projectId,
    secret
}: {
    open: boolean,
    onOpenChange: Dispatch<SetStateAction<boolean>>,
    projectId: string,
    secret: { key: string, value: string }
}) {
    const [value, setValue] = useState(secret.value)

    const { mutate: add, isPending } = useMutation({
        mutationFn: () => updateSecret(secret.key, value, projectId),
        onMutate: () => toast.loading("Updating...", { id:"update-secret" }),
        onError: (e) => toast.error(`Failed to update secret: ${e}`, { id:"update-secret" }),
        onSuccess: () => toast.success("Changes Applied", { id:"update-secret" })
    })

    return (
        <SheetWrapper
            open={open}
            disabled={!value}
            onSubmit={() => add()}
            submitButtonText="Apply changes"
            title="Update Secret"
            onDiscard={() => {
                setValue('')
            }}
            isDirty={() => Boolean(value !== "")}
            isPending={isPending}

            onOpenChange={onOpenChange}
        >
            <div className="flex flex-col gap-2">
                <h1>Key</h1>
                <Input 
                    disabled
                    value={secret.key}
                    className="w-full cursor-not-allowed"
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