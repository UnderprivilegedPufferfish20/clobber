"use client"

import SheetWrapper from "@/components/SheetWrapper"
import { Dispatch, SetStateAction } from "react"

export default function EditSecretSheet({
    open,
    onOpenChange
}: {
    open: boolean,
    onOpenChange: Dispatch<SetStateAction<boolean>>
}) {
    return (
        <SheetWrapper
            open={open}
            onOpenChange={onOpenChange}
        >

        </SheetWrapper>
    )
}