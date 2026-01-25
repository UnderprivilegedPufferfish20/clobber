"use client";

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RoleType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CrownIcon, EditIcon, EllipsisVerticalIcon, LockOpenIcon, ScanFaceIcon, Trash2Icon, UserIcon, UserRoundPlusIcon } from 'lucide-react'
import React, { useState } from 'react'
import EditRoleSheet from '../sheets/EditRoleSheet';
import { usePathname } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { deleteRole } from '@/lib/actions/database/roles';
import DeleteDialog from '@/components/DeleteDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RoleCard = ({
  can_bypass_rls,
  can_create_roles,
  can_login,
  name,
  is_superuser
}: RoleType) => {

  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const disabledClassname = "size-6 text-gray-400 opacity-50 transition-all duration-300"
  const activatedClassname = "size-6 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300"

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
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-muted-foreground" />
              <h3 className="font-semibold text-2xl truncate">{name}</h3>
            </div>
          </div>

          <div className='flex items-center justify-center gap-6'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ScanFaceIcon
                    className={`${can_login ? activatedClassname : disabledClassname}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Can Login
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <UserRoundPlusIcon className={`${can_create_roles ? activatedClassname : disabledClassname}`} />
                </TooltipTrigger>
                <TooltipContent>
                  Can Create Roles
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <LockOpenIcon className={`${can_bypass_rls ? activatedClassname : disabledClassname}`} />
                </TooltipTrigger>
                <TooltipContent>
                  Can Bypass Row Level Security
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <CrownIcon className={`${is_superuser ? activatedClassname : disabledClassname}`} />
                </TooltipTrigger>
                <TooltipContent>
                  Is Superuser (readonly)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={"icon"}
                variant={'ghost'}
              >
                <EllipsisVerticalIcon className='w-4 h-4'/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuItem
                className='flex items-center gap-2'
                onClick={() => setIsEditOpen(true)}
              >
                <EditIcon className='w-6 h-6'/>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='flex items-center gap-2'
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2Icon className='w-6 h-6'/>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditRoleSheet 
        onOpenChange={setIsEditOpen}
        open={isEditOpen}
        projectId={projectId}
        role={{
          name,
          can_bypass_rls,
          can_create_roles,
          can_login,
          is_superuser
        }}
      />

      <DeleteDialog
        toBeDeleted="Role"
        deleteFunction={deleteRole}
        name={name}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        projectId={projectId}
        schema={""}
        table={""}
      />
    </>
  )
}

export default RoleCard