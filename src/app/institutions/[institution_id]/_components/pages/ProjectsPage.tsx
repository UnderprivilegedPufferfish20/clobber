"use client";

import CreateProjectDialog from '@/app/proj/_components/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { get_institution_by_id } from '@/lib/actions/database/cache-actions';
import { cn } from '@/lib/utils';
import { Project } from '@prisma/client';
import { DatabaseZapIcon, InboxIcon, PlusIcon, Search } from 'lucide-react';
import Link from 'next/link';
import React, { Fragment, useMemo, useState } from 'react'

const ProjectsPage = ({
  inst
}: {
  inst: Awaited<ReturnType<typeof get_institution_by_id>>
}) => {
  if (!inst) throw new Error("No inst");

  const [searchStr, setSearchStr] = useState("")
  const [isCreatProjectOpen, setIsCreateProjectOpen] = useState(false)

  const filteredProjects = useMemo(() => {
    return inst.projects.filter(p => p.name.toLowerCase().includes(searchStr.toLowerCase()))
  }, [searchStr])

  const isNoData = filteredProjects.length === 0;
  const isSearchActive = !!searchStr.trim();

  return (
    <>
      <div className="fullscreen flex flex-col gap-6 overflow-y-scroll hide-scrollbar">
        <div className='flex flex-col gap-4'>
          <h1 className='text-2xl font-bold p-2 mb-8'>Projects</h1>
          <div className='fullwidth flex items-center justify-between p-2'>
            <div className='relative'>
              <Input 
                disabled={isNoData}
                placeholder="Search for project..."
                value={searchStr}
                className='w-md min-w-md max-w-md'
                onChange={e => setSearchStr(e.target.value)}
              />

              {isSearchActive && (
                <p className='absolute left-0 -bottom-7 pl-1 text-sm text-muted-foreground'>
                  {filteredProjects.length} results
                </p>
              )}
            </div>

            <Button
              className='flex items-center gap-2'
              variant={"default"}
              onClick={() => setIsCreateProjectOpen(true)}
            >
              <PlusIcon className='w-5 h-5'/>
              Create Project
            </Button>
            
          </div>
        </div>

        
        
          {isNoData && isSearchActive ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <Search size={72} className="text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">No matches</h2>
                <p className="text-muted-foreground text-sm">
                  No projects match “{searchStr.trim()}”.
                </p>
              </div>
              <Button
                onClick={() => setSearchStr("")}
              >
                Clear Search
              </Button>
            </div>
          ) : isNoData ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
              <InboxIcon size={96} className="text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">No projects</h2>
                <p className="text-muted-foreground text-sm">
                  Create project
                </p>
              </div>

              <Button
                onClick={() => setIsCreateProjectOpen(true)}
                variant={"default"}
              >
                Create project
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 p-2">
              {filteredProjects.map(p => (
                <Card 
                  {...p}
                  key={p.id}
                />
              ))}
            </div>
          )}
        </div>

      <CreateProjectDialog 
        open={isCreatProjectOpen}
        setOpen={setIsCreateProjectOpen}
        inst_id={inst.id}          
      />
      
    </>
  )
}

export default ProjectsPage;

const Card = ({
  name,
  id,
  createdAt,
}: Project) => {


  return (
    <Link
      href={`/proj/${id}`}
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
            <DatabaseZapIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg truncate">{name}</h3>
          </div>

          <p className='text-muted-foreground text-sm'>{createdAt.toLocaleDateString()}</p>

        </div>
    </Link>
  )
}