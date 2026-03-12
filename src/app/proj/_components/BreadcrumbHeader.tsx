'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BuildingIcon, Check, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/Logo';
import { MobileSidebar } from './Sidebar';
import { Separator } from '@/components/ui/separator';
import CreateProjectDialog from './CreateProjectDialog';
import { Prisma, User, Project } from '@prisma/client';
import TextInputDialog from '@/components/TextInputDialog';
import { create_institution } from '@/lib/actions/database/actions';

export default function BreadcrumbHeader({
  current_institution,
  current_project,
  institutions,
  user
}: {
  current_institution: Prisma.InstitutionGetPayload<{ include: { projects: true } }>,
  current_project: Project
  institutions: Prisma.InstitutionGetPayload<{ include: { _count: { select: { projects: true } } } }>[],
  user: User
}) {
  const router = useRouter();

  const [openInst, setOpenInst] = useState(false);
  const [openProj, setOpenProj] = useState(false);
  const [createInstOpen, setCreateInstOpen] = useState(false)
  const [createProjOpen, setCreateProjOpen] = useState(false)
  const [newInstName, setNewInstName] = useState("")
  const [view, setView] = useState<'my' | 'shared'>('my');


  const instList = useMemo(() => {
    if (view === 'my') {
      return institutions.filter(i => i.ownerId === user.id)
    }

    return institutions.filter(i => i.ownerId !== user.id)
    
  }, [view])

  return (
    <>
    
      <div className="flex items-center gap-3 w-full z-0">
        <div className="hidden md:block mr-2">
          <Logo text={false} iconSize={32}/>
        </div>
        

        <MobileSidebar />
        
        <HeaderSeperator />
        
        <div className='flex items-center gap-0'>
          
          <HeaderRouteName 
            route={`/institutions/${current_institution.id}`}
            current={current_institution}
          />

          <Popover open={openInst} onOpenChange={setOpenInst}>
            <PopoverTrigger asChild className='hover:bg-background cursor-pointer'>
              <Button
                size={"icon-lg"}
                className='cursor-pointer hover:bg-background bg-transparent text-primary'
              >
                <ChevronsUpDownIcon className='w-6 h-6'/>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-65 p-0 z-100">
              <Command>
                <CommandInput placeholder="Search institutions..." className="h-9" />
                <CommandList>
                  
                  
                  {/* Toggle Button for Views */}
                  <div className="flex justify-center p-1 bg-muted">
                    <button
                      onClick={() => setView('my')}
                      className={cn(
                        'flex-1 text-sm p-1 rounded-sm transition-colors',
                        view === 'my' ? 'bg-white shadow-sm font-medium dark:text-black' : 'text-muted-foreground'
                      )}
                    >
                      My Institutions
                    </button>
                    <button
                      onClick={() => setView('shared')}
                      className={cn(
                        'flex-1 text-sm p-1 rounded-sm transition-colors',
                        view === 'shared' ? 'bg-white shadow-sm font-medium dark:text-black' : 'text-muted-foreground'
                      )}
                    >
                      Shared with me
                    </button>
                  </div>

                  <CommandEmpty>No institutions found.</CommandEmpty>

                  <CommandGroup>
                    {instList.map(i => {
                      const selected = i.id === current_institution.id;
                      return (
                        <CommandItem
                          key={i.id}
                          value={i.id}
                          onSelect={(nextId) => {
                            setOpenInst(false);
                            if (nextId !== i.id) router.push(`/institutions/${nextId}`)
                          }}
                        >
                          {i.name}
                          <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>

                <Separator />
                {view === "my" && (
                  <CommandGroup>
                    <Button
                      variant={"ghost"}
                      className='fullwidth flex items-center justify-start gap-2 p-1! cursor-pointer'
                      onClick={() => setCreateInstOpen(true)}
                    >
                      <PlusIcon className='w-5 h-5'/>
                      Create Institution
                    </Button>
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>


        
        <HeaderSeperator />

        <div className='flex items-center gap-0'>
          
          <HeaderRouteName 
            route={`/proj/${current_project.id}`}
            current={current_project}
          />
          
          <Popover open={openProj} onOpenChange={setOpenProj}>
            <PopoverTrigger asChild className='hover:bg-background cursor-pointer'>
              <Button
                size={"icon-lg"}
                className='cursor-pointer hover:bg-background bg-transparent text-primary'
              >
                <ChevronsUpDownIcon className='w-6 h-6'/>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-65 p-0 z-100">
              <Command>
                <CommandInput placeholder="Search project..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>

                  <CommandGroup>
                    {current_institution.projects.map(p => {
                      const selected = p.id === current_project.id;
                      return (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={(nextPId) => {
                            setOpenProj(false);
                            
                            if (nextPId !== p.id) router.push(`/proj/${nextPId}`);
                            
                          }}
                        >
                          {p.name}
                          <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>

                <Separator />
                
                  <CommandGroup>
                    <Button
                      variant={"ghost"}
                      className='fullwidth flex items-center justify-start gap-2 p-1! cursor-pointer'
                      onClick={() => setCreateProjOpen(true)}
                    >
                      <PlusIcon className='w-5 h-5'/>
                      Create Project
                    </Button>
                  </CommandGroup>
              
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <CreateProjectDialog 
        inst_id={current_institution.id}
        open={createProjOpen}
        setOpen={setCreateProjOpen}
      />

      <TextInputDialog 
        open={createInstOpen}
        onOpenChange={setCreateInstOpen}
        value={newInstName}
        onValueChange={setNewInstName}
        toastId='new-inst'
        successMessage="Institution Created"
        loadingMessage='Creating...'
        headerTitle='Create Institution'
        headerIcon={BuildingIcon}
        errorMessage='Failed to create Institution'
        action={create_institution}
        actionArgs={[newInstName, user.id]}
      />
    </>
  );
}

interface HasName {
  name: string
}

function HeaderRouteName<T extends HasName | null>(
  {route, current}: {
    route: string, current: T
  }
) {
  return (
    <Link
      href={route}
      className='text-xl hover:bg-background text-primary rounded-lg transition-colors duration-200 p-2'
    >
      {current ? current.name : (
        <div className="px-0">
          <Skeleton className="h-8 w-32 bg-background" />
        </div>
      )}
    </Link>
  )
}

export function HeaderSeperator() {
  return (
    <div className="hidden md:block h-5 w-0.5 bg-black/10 rotate-12 dark:bg-white/20" />
  )
}