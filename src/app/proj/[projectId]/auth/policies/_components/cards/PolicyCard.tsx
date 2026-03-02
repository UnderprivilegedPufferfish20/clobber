"use client"

import { Button } from '@/components/ui/button'
import { PolicyType, TableCardProps, TablePolicy } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Table2Icon } from 'lucide-react'
import React, { useState } from 'react'
import AddPolicySheet from '../sheets/AddPolicySheet'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getRoles } from '@/lib/actions/database/roles/cache-actions'
import { getSchemas } from '@/lib/actions/database/cache-actions'
import Loader from '@/components/Loader'

const PolicyCard = ({
  name,
  schema,
  policies,
  roles,
  schemas
}: TableCardProps) => {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const pathname = usePathname()

  const project_id = pathname.split('/')[2]

  return (
    <>
    
      <div
        className={cn(
          "group rounded-xl border bg-secondary",
          "transition-all duration-150",
          "flex flex-col",
          "hover:-translate-y-0.5 hover:shadow-md",
          "hover:border-foreground/20"
        )}
      >
        <div className='flex fullwidth items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-2'>
            <Table2Icon className='w-6 h-6'/>
            <h2 className='text-lg'>{name}</h2>
          </div>

          <Button
            variant={"outline"}
            onClick={() => setCreateSheetOpen(true)}
          >
            Create policy
          </Button>
        </div>

        <>
          {policies.length > 0 ? (
            <div className='flex flex-col'>
              <div className='flex items-center bg-background text-muted-foreground text-sm'>
                <p>NAME</p>
                <p>COMMAND</p>
                <p>ROLES</p>
              </div>
              {policies.map(p => (
                <div className='flex items-center bg-background text-muted-foreground text-sm'>
                  <p className='text-primary'>{p.name}</p>
                  <p>{p.comand.toUpperCase()}</p>
                  <p>{p.target_roles.join(", ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center p-12 text-muted-foreground text-xl'>
              <p>No RLS Policies</p>
            </div>
          )}
        </>
      </div>

      <AddPolicySheet 
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        projectId={project_id}
        originalTable={name}
        originalSchema={schema}
        roles={roles}
        schemas={schemas}
      />
    </>
  )
}

export default PolicyCard