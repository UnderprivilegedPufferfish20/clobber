"use client";

import SheetWrapper from '@/components/SheetWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { createRole, editRole } from '@/lib/actions/database/roles';
import { DatabaseObjectAddSheetProps, RoleType } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';
import React, { Dispatch, SetStateAction, useState } from 'react'
import { toast } from 'sonner';

const EditRoleSheet = ({
  onOpenChange,
  open,
  projectId,
  role
}: {
  onOpenChange: Dispatch<SetStateAction<boolean>>
  open: boolean,
  projectId: string,
  role: RoleType
}) => {
  const [name, setName] = useState(role.name)

  const [canLogin, setCanLogin] = useState(role.can_login)
  const [canCreateRoles, setCanCreateRoles] = useState(role.can_create_roles)
  const [bypassRLS, setBypassRLS] = useState(role.can_bypass_rls)
  const [isSuperuser, setIsSuperuser] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      editRole(projectId, role, { name, can_bypass_rls: bypassRLS, can_create_roles: canCreateRoles, is_superuser: false, can_login: canLogin });
      setName(role.name)
      setBypassRLS(role.can_bypass_rls)
      setCanCreateRoles(role.can_create_roles)
      setCanLogin(role.can_login)
    },
    onMutate: () => { toast.loading("Applying Changes...", { id: "edit-role" }) },
    onSuccess: () => { toast.success("Changes Applied", { id: "edit-role" }) },
    onError: (e) => { toast.error(`Failed to edit role: ${e}`, { id: "edit-role" }) }
  })

  return (
    <SheetWrapper
      title="Edit role"
      disabled={name === role.name && role.can_bypass_rls === bypassRLS && role.can_create_roles === canCreateRoles && role.can_login === canLogin}
      onSubmit={() => {
        mutate();
        onOpenChange(false)
      }}
      isPending={isPending}
      onOpenChange={onOpenChange}
      open={open}
      submitButtonText='Create Role'
      onDiscard={() => {
        setName(role.name)
        setBypassRLS(role.can_bypass_rls)
        setCanCreateRoles(role.can_create_roles)
        setCanLogin(role.can_login)
      }}
      isDirty={() => name !== role.name || role.can_bypass_rls !== bypassRLS || role.can_create_roles !== canCreateRoles || role.can_login !== canLogin}
    >
      <div className='flex flex-col gap-2'>
        <h1>Name</h1>

        <Input 
          className='w-full'
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <h1>Privileges</h1>

        <div className='flex flex-col gap-2'>

          <div className='flex items-center gap-2 group text-muted-foreground'>
            <Switch
              id='canlogin' 
              defaultChecked={canLogin}
              onClick={() => setCanLogin(p => !p)} 
            />
            <Label htmlFor='canlogin' className={`group-hover:text-white text-lg transition-colors duration-200 ${canLogin && 'text-white!'}`}>Can Login</Label>
          </div>

          <div className='flex items-center gap-2 group text-muted-foreground'>
            <Switch
              id="cancreateroles"
              defaultChecked={canCreateRoles}
              onClick={() => setCanCreateRoles(p => !p)} 
            />
            <Label htmlFor='cancreateroles' className={`group-hover:text-white text-lg  transition-colors duration-200 ${canCreateRoles && 'text-white!'}`}>Can Create Roles</Label>
          </div>

          <div className='flex items-center gap-2 group text-muted-foreground'>
            <Switch
              id="canbypassrls"
              defaultChecked={bypassRLS}
              onClick={() => setBypassRLS(p => !p)} 
            />
            <Label htmlFor='canbypassrls' className={`group-hover:text-white text-lg transition-colors duration-200 ${bypassRLS && 'text-white!'}`}>Can Bypass Row Level Security</Label>
          </div>

          <Separator />

          <div className='flex items-center gap-2 group text-muted-foreground'>
            <Switch
              className='cursor-not-allowed' 
              disabled={true}
              defaultChecked={isSuperuser}
              id="superuser"
            />
            <Label htmlFor='superuser' className={`group-hover:text-white text-lg transition-colors duration-200 ${isSuperuser && 'text-white!'}`}>Is Superuser (readonly)</Label>
          </div>
        </div>
      </div>
    </SheetWrapper>
  )
}

export default EditRoleSheet