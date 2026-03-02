"use client";

import { MultiSelectCombobox } from '@/components/MultiSelectCombobox';
import SheetWrapper from '@/components/SheetWrapper';
import TableSelectSheet from '@/components/TableSelectSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { PolicyBehavior, PolicyCommand } from '@/lib/types';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { AmpersandIcon, MinusIcon } from 'lucide-react';
import { Dispatch, SetStateAction, useRef, useState } from 'react'
import CodeMirror from "@uiw/react-codemirror";

const AddPolicySheet = ({
  open,
  onOpenChange,
  roles,
  originalSchema,
  originalTable,
  tables
}: {
  open: boolean, 
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  roles: string[],
  originalSchema?: string,
  originalTable?: string,
  tables: Record<string, string[]>
}) => {
  const [name, setName] = useState("")
  const [schema, setSchema] = useState(originalSchema ? originalSchema : "")
  const [table, setTable] = useState(originalTable ? originalTable : "")
  const [behavior, setBehavior] = useState<PolicyBehavior>(PolicyBehavior.PERMISSIVE)
  const [command, setCommand] = useState<PolicyCommand>(PolicyCommand.SELECT)
  const [targetedRoles, setTargetedRoles] = useState<string[]>([])
  const [usingQuery, setUsingQuery] = useState<string>('')


  return (
    <SheetWrapper
      open={open}
      onOpenChange={onOpenChange}
      title='Create Policy'
      description='Ensure data security'
      disabled={false}
      
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

      <div className="flex flex-col gap-2">
          <h1 className='font-semibold text-lg'>Table</h1>
          
          <TableSelectSheet 
            schema={schema}
            table={table}
            tables={tables}
            setSchema={setSchema}
            setTable={setTable}
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
            <div className='flex items-center gap-2'>
              <RadioGroupItem value={v} id={v} />
              <Label htmlFor={v}>{v.toUpperCase()}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-semibold'>Roles</h2>
        <MultiSelectCombobox 
          onChange={setTargetedRoles}
          value={targetedRoles}
          options={roles}
          searchPlaceholder='Search Roles...'
          placeholder='All roles will be target if none are selected'
        />
      </div>

      <div className='flex flex-col gap-2'>
          <Label className="text-secondary-foreground text-lg font-semibold">"Using" statement</Label>
          <div className="rounded-md border border-input overflow-hidden">
            <CodeMirror
              value={usingQuery}
              height="256px"
              theme={"none"}
              // 2. Add the linter to the extensions array
              extensions={[sql({ dialect: PostgreSQL })]}
              onChange={(value: string) => setUsingQuery(value)}
              className="text-sm [&_.cm-editor]:bg-background! [&_.cm-gutters]:bg-background! [&_.cm-gutters]:border-r-none!"
            />
          </div>
        </div>
    </SheetWrapper>

  )
}

export default AddPolicySheet



