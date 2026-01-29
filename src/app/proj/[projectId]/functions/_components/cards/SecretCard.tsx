'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EdgeFunctionSecretType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EditIcon, EllipsisVerticalIcon, Trash2Icon } from 'lucide-react';
import React, { useState } from 'react'
import EditSecretSheet from '../sheets/EditSecretSheet';
import { usePathname } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { deleteSecret } from '@/lib/actions/functions/secrets';
import { toast } from 'sonner';

const SecretCard = ({
    createdAt,
    name,
    updatedAt,
    value
}: EdgeFunctionSecretType) => {

    console.log("@NAME", name)

    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const pathname = usePathname()
    const projectId = pathname.split("/")[2]

    const { mutate: del, isPending } = useMutation({
        mutationFn: () => deleteSecret(name, projectId),
        onMutate: () => toast.loading("Deleting", { id: "delete-secret" }),
        onError: (e) => toast.error(`Failed to delete secret: ${e}`, { id: "delete-secret" }),
        onSuccess: () => toast.success("Secret Deleted", { id: "delete-secret" })
    })

  return (
    <>
        <div 
            className={cn(
                "group rounded-xl border bg-background p-4",
                "transition-all duration-150",
                "hover:-translate-y-0.5 hover:shadow-md",
                "hover:border-foreground/20",
                "flex flex-col gap-4"
            )}
        >
            <div className='flex items-center justify-between'>
                <h1 className='truncate'>{name}</h1>

                <div className='flex items-center gap-2'>
                    <p className='text-muted-foreground truncate'>{createdAt}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <EllipsisVerticalIcon className='w-4 h-4' />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                            <DropdownMenuItem
                                className='flex items-center gap-2'
                                onClick={() => setIsEditOpen(true)}
                            >
                                <EditIcon className='w-4 h-4'/>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className='flex items-center gap-2'
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash2Icon className='w-4 h-4'/>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <p className='text-muted-foreground truncate'>{value}</p>
        </div>

        <EditSecretSheet 
            projectId={projectId}
            onOpenChange={setIsEditOpen}
            open={isEditOpen}
            secret={{key: name, value}}
        />

        <AlertDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
        >
            <AlertDialogContent>

            <AlertDialogHeader>
                <AlertDialogTitle>Comfirm delete "{name}"</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone</AlertDialogDescription>
            </AlertDialogHeader>
                <AlertDialogFooter className='flex items-center justify-end gap-2'>
                    <Button
                        variant={"secondary"}
                        onClick={() => setIsDeleteOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={"default"}
                        onClick={() => del()}
                        disabled={isPending}
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}

export default SecretCard