"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserById } from '@/lib/actions/auth/cache-actions';
import { cn } from '@/lib/utils';
import { BuildingIcon, InboxIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import React, { Fragment, useState } from 'react'

const InstiPage = ({
  user
}: {
  user: Awaited<ReturnType<typeof getUserById>>
}) => {
  if (!user) throw new Error("Must be user");

  const [searchStr, setSearchStr] = useState('')

  return (
    <div className="fullscreen flex flex-col gap-8 overflow-y-scroll hide-scrollbar">
      <div className="flex flex-col gap-2 p-2">

        <div className='flex flex-col gap-4'>
          <h1 className='text-2xl font-bold p-2 mb-8'>Institutions</h1>
          <div className='fullwidth flex items-center justify-between p-2 mb-2'>
            <Input 
              placeholder="Search for institution..."
              value={searchStr}
              className='w-md min-w-md max-w-md'
              onChange={e => setSearchStr(e.target.value)}
            />

            <Button
              className='flex items-center gap-2'
              variant={"default"}
            >
              <PlusIcon className='w-5 h-5'/>
              Create Institution
            </Button>
          </div>
        </div>

        <h1 className="text-xl font-bold pl-2">Owned</h1>
        <div className="flex flex-wrap gap-2 p-2">
          {user.ownedInstitutions.length > 0 ? (
            <Fragment>
              {user.ownedInstitutions.map(i => (
                <Card 
                  key={i.id}
                  id={i.id}
                  name={i.name}
                  plan={i.plan}
                  project_count={i._count.projects}
                />
              ))}
            </Fragment>
          ) : (
            <div className='flex items-center justify-center text-muted-foreground mx-auto p-4'>
              <div className='flex items-center flex-col gap-2'>
                <InboxIcon className='w-16 h-16'/>

                <p>No owned institutions</p>

              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2">
        <h1 className="text-xl font-bold pl-2">Other</h1>
        <div className="flex flex-wrap gap-2 p-2">
          {user.collaborator.length > 0 ? (
            <Fragment>
              {user.collaborator.map(i => (
                <Card
                  key={i.id}
                  id={i.id}
                  name={i.name}
                  plan={i.plan}
                  project_count={i._count.projects}
                />
              ))}
            </Fragment>
          ) : (
            <div className='flex items-center justify-center text-muted-foreground mx-auto p-4'>
              <div className='flex items-center flex-col gap-2'>
                <InboxIcon className='w-16 h-16'/>

                <p>Not a collaborator</p>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstiPage

const Card = ({
  name,
  id,
  plan,
  project_count 
}: {
  name: string,
  id: string,
  plan: string,
  project_count: number
}) => {


  return (
    <Link
      href={`/institutions/${id}`}
      className={cn(
        "group rounded-xl border bg-background p-4",
        "transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-foreground/20",
        "w-xs min-w-xs max-w-xs"
      )}
    >
      <div className="flex flex-col fullwidth gap-4">

          <div className="flex items-center gap-2">
            <BuildingIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg truncate">{name}</h3>
          </div>

          <div className='flex items-center justify-between'>
            <span className="text-black dark:text-white text-sm">{plan}</span>
            <span className='text-muted-foreground text-sm'>{project_count} projects</span>
          </div>

        </div>
    </Link>
  )
}