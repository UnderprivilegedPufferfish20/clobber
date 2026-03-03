"use client"

import { Button } from '@/components/ui/button'
import { PolicyBehavior, PolicyCommand, PolicyType, TableCardProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AmpersandIcon, Edit2Icon, EllipsisVerticalIcon, MinusIcon, Table2Icon, Trash2Icon } from 'lucide-react'
import { Dispatch, Fragment, SetStateAction, useEffect, useRef, useState } from 'react'
import AddPolicySheet from '../sheets/AddPolicySheet'
import { usePathname } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toggle_rls } from '@/lib/actions/database/tables'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import SheetWrapper from '@/components/SheetWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import CodeMirror from "@uiw/react-codemirror"
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MultiSelectCombobox } from '@/components/MultiSelectCombobox'
import { PostgreSQL, sql } from '@codemirror/lang-sql'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { delete_policy, update_policy } from '@/lib/actions/auth'
import { fa } from 'zod/v4/locales'

const PolicyCard = ({
  name,
  schema,
  policies,
  roles,
  tables,
  rls
}: TableCardProps) => {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const pathname = usePathname()
  const [activeRls, setActiveRls] = useState(rls)
  const oldRls = useRef(rls)
  const [editIdx, setEditIdx] = useState<null | number>(null)
  const [deleteIdx, setDeleteIdx] = useState<null | number>(null)

  const project_id = pathname.split('/')[2]

  const {mutate} = useMutation({
    mutationFn: () => toggle_rls(project_id, schema, name, oldRls.current, activeRls),
    onMutate: () => toast.loading(`${oldRls.current === true && activeRls === false ? "Disabling RLS..." : "Enabling RLS"}`, {id: "r-t"}),
    onError: (e) => toast.error(`Failed to ${oldRls.current === true && activeRls === false ? "disable" : "enable"} RLS: ${e}`, {id: "r-t"}),
    onSuccess: () => toast.success(`${oldRls.current === true && activeRls === false ? "RLS Disabled" : "RLS Enabled"}`, {id: "r-t"})
  })

  const {mutate: delPol} = useMutation({
    mutationFn: () => delete_policy(project_id, policies[deleteIdx!].name, schema, name),
    onMutate: () => toast.loading(`Deleting Policy`, {id: "del-p"}),
    onError: (e) => toast.error(`Failed to delete policy: ${e}`, {id: "del-p"}),
    onSuccess: () => {
      toast.success(`Policy deleted`, {id: "del-p"})
      setDeleteIdx(null)
    }
  })

  return (
    <>
    
      <div
        className={cn(
          "group rounded-xl border bg-secondary",
          "transition-all duration-150",
          "flex flex-col",
          "hover:-translate-y-0.5 hover:shadow-md",
          !activeRls && "border-yellow-400"
        )}
      >
        <div className='flex fullwidth items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-2'>
            <Table2Icon className='w-6 h-6'/>
            <h2 className='text-lg'>{name}</h2>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={"outline"}
              onClick={() => {
                oldRls.current = activeRls
                setActiveRls(p => !p)
                mutate()
              }}
            >
              {activeRls ? "Disable RLS" : "Enable RLS"}
            </Button>

            <Button
              variant={"outline"}
              onClick={() => setCreateSheetOpen(true)}
            >
              Create policy
            </Button>
          </div>

        </div>

        <>
          {!activeRls ? (
            <div className='flex items-center justify-center p-12 text-muted-foreground text-xl'>
              <p>RLS is disabled</p>
            </div>
          ) : (
            <Fragment>
              {policies.length > 0 ? (
                <div className='flex flex-col'>
                  <div className='flex items-center bg-background text-muted-foreground p-2'>
                    <h3 className='mr-48'>Name</h3>
                    <h3 className='mr-48'>Command</h3>
                    <h3>Roles</h3>
                  </div>
                  {policies.map((p, idx) => (
                    <div key={idx} className='flex items-center justify-between bg-secondary text-muted-foreground text-sm p-2'>
                      <div className='flex items-center'>
                        <p className='text-primary mr-52'>{p.name}</p>
                        <p className='mr-62'>{p.comand.toUpperCase()}</p>
                        <p>{p.target_roles.join(", ")}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size={"icon-sm"}
                            variant={"ghost"}
                          >
                            <EllipsisVerticalIcon className='w-5 h-5'/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            className='flex items-center gap-2'
                            onClick={() => setEditIdx(idx)}
                          > 
                            <Edit2Icon className='w-5 h-5'/>
                            Edit Policy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='flex items-center gap-2'
                            onClick={() => setDeleteIdx(idx)}
                          > 
                            <Trash2Icon className='w-5 h-5'/>
                            Delete Policy
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex items-center justify-center p-12 text-muted-foreground text-xl'>
                  <p>No RLS Policies</p>
                </div>
              )}
            </Fragment>
          )}
        </>
      </div>

      <AddPolicySheet 
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        project_id={project_id}
        originalTable={name}
        originalSchema={schema}
        roles={roles}
        tables={tables}
      />

      {editIdx !== null && policies[editIdx] && (
        <EditPolicySheet
          open={true}
          onOpenChange={() => setEditIdx(null)}
          policy={policies[editIdx]}
          roles={roles} 
          table={name}
          schema={schema}
          project_id={project_id}
        />
      )}

      <AlertDialog
        open={deleteIdx !== null}
        onOpenChange={() => setDeleteIdx(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete policy
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => delPol()}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PolicyCard


const EditPolicySheet = ({
  project_id,
  schema,
  table,
  policy,
  open,
  roles,
  onOpenChange,
}: {
  project_id: string,
  schema: string,
  table: string,
  policy: PolicyType,
  open: boolean,
  roles: string[],
  onOpenChange: Dispatch<SetStateAction<boolean>>,

}) => {

  console.log("@P: ", policy)

  const [name, setName] = useState(policy.name)
  const [check_command, setCheckCommand] = useState(policy.check_command)
  const [behavior, setBehavior] = useState(policy.behavior)
  const [command, setCommand] = useState(policy.comand ?? "")
  const [target_roles, setTargetRoles] = useState(policy.target_roles)

  const {mutate, isPending} = useMutation({
    mutationFn: () => update_policy(
      project_id, 
      policy.name, 
      schema, 
      table, 
      policy,
      {
        name,
        check_command,
        behavior,
        comand: command,
        target_roles
      }
    ),
    onMutate: () => {
      toast.loading("Applying Changes...", {id:"edit-policy"})
      onOpenChange(false)
    },
    onError: (e) => toast.error(`Failed to edit policy: ${e}`, {id:"edit-policy"}),
    onSuccess: () => toast.success("Changed applied", {id:"edit-policy"})

  })

  return (
    <SheetWrapper
      onSubmit={mutate}
      onDiscard={() => {
        setName(policy.name)
        setCheckCommand(policy.check_command)
        setBehavior(policy.behavior)
        setCommand(policy.comand)
        setTargetRoles(policy.target_roles)
      }}
      title='Edit Policy'
      disabled={
        JSON.stringify(policy) ===
        JSON.stringify({
          name,
          behavior,
          comand: command,
          target_roles,
          check_command,
      })}
      isDirty={() => {
        return JSON.stringify(policy) !==
        JSON.stringify({
          name,
          behavior,
          comand: command,
          target_roles,
          check_command,
        })
      }}

      open={open}
      onOpenChange={onOpenChange}
      submitButtonText='Apply Changes'
      isPending={isPending}
    >
      <div className='flex flex-col gap-2'>
        <Label className='text-lg font-semibold' htmlFor='name'>Name</Label>
        <Input 
          value={name}
          onChange={e => setName(e.target.value)}
          className='fullwidth'
          placeholder='Policy Name'
          id='name'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-semibold'>Behavior</h2>
        <Select
          value={behavior}
          onValueChange={v => setBehavior(v as PolicyBehavior)}
        >
          <SelectTrigger className='fullwidth font-semibold text-sm'>
            <div className='flex items-center gap-2 text-sm'>
              {behavior === PolicyBehavior.PERMISSIVE ? (
                <MinusIcon className='w-4 h-4 rotate-90'/>
              ) : (
                <AmpersandIcon className='w-4 h-4'/>
              )}
              
              {behavior}
            </div>
          </SelectTrigger>
          <SelectContent className='z-250'>
            {Object.values(PolicyBehavior).map(p => (
              <SelectItem 
                key={p} 
                value={p}
              >
                <div className='flex flex-col gap-2'>

                  <div className='flex items-center gap-2 text-sm'>
                    {p === PolicyBehavior.PERMISSIVE ? (
                      <MinusIcon className='w-4 h-4 rotate-90'/>
                    ) : (
                      <AmpersandIcon className='w-4 h-4'/>
                    )}
                    
                    {p}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {p === PolicyBehavior.PERMISSIVE ? (
                      'Policies are combined using the "OR" operator'
                    ) : (
                      'Policies are combined using the "AND" operator'
                    )}
                  </p>
                </div>
              </SelectItem>
            ))}

          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='font-semibold text-lg'>Command</h2>

        <RadioGroup 
          value={command} 
          onValueChange={v => setCommand(v as PolicyCommand)} 
          defaultValue="SELECT" 
          className='flex flex-col gap-1'
        >
          {Object.values(PolicyCommand).map(v => (
            <div key={v} className='flex items-center gap-2'>
              <RadioGroupItem value={v} id={v} />
              <Label htmlFor={v}>{v.toUpperCase()}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-semibold'>Roles</h2>
        <MultiSelectCombobox 
          onChange={setTargetRoles}
          value={target_roles}
          options={roles}
          searchPlaceholder='Search Roles...'
          placeholder='All roles will be target if none are selected'
        />
      </div>

      <div className='flex flex-col gap-2'>
          <Label className="text-secondary-foreground text-lg font-semibold">"Using" statement</Label>
          <div className="rounded-md border border-input overflow-hidden">
            <CodeMirror
              value={check_command ?? ""}
              height="256px"
              theme={"none"}
              // 2. Add the linter to the extensions array
              extensions={[sql({ dialect: PostgreSQL })]}
              onChange={(value: string) => setCheckCommand(value)}
              className="text-sm [&_.cm-editor]:bg-background! [&_.cm-gutters]:bg-background! [&_.cm-gutters]:border-r-none!"
            />
          </div>
        </div>
    </SheetWrapper>
  )
}