"use client";

import SheetWrapper from '@/components/SheetWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { createRole } from '@/lib/actions/database/roles';
import { useMutation } from '@tanstack/react-query';
import React, { Dispatch, SetStateAction, useState } from 'react'
import { toast } from 'sonner';

const AddRoleSheet = ({
  onOpenChange,
  open,
  projectId,
}: {
  projectId: string,
  open: boolean, 
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) => {
  const [name, setName] = useState("")

  const [canLogin, setCanLogin] = useState(true)
  const [canCreateRoles, setCanCreateRoles] = useState(false)
  const [bypassRLS, setBypassRLS] = useState(false)
  const [isSuperuser, setIsSuperuser] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      createRole(projectId, { name, can_bypass_rls: bypassRLS, can_create_roles: canCreateRoles, is_superuser: false, can_login: canLogin });
      setName("")
      setBypassRLS(false)
      setCanCreateRoles(false)
      setCanLogin(true)
    },
    onMutate: () => { toast.loading("Creating...", { id: "create-role" }) },
    onSuccess: () => { toast.success("Role created", { id: "create-role" }) },
    onError: (e) => { toast.error(`Failed to create role: ${e}`, { id: "create-role" }) }
  })

  return (
    <SheetWrapper
      title="Create role"
      description='Enhances data protection'
      disabled={!name || isSuperuser === true}
      onSubmit={() => {
        mutate();
        onOpenChange(false)
      }}
      isPending={isPending}
      onOpenChange={onOpenChange}
      open={open}
      submitButtonText='Create Role'
      onDiscard={() => {
        setName("")
        setBypassRLS(false)
        setCanCreateRoles(false)
        setCanLogin(true)
      }}
      isDirty={() => Boolean(name || canLogin !== true || canCreateRoles === true || bypassRLS === true)}
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

export default AddRoleSheet