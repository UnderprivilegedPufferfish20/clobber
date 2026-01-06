'use client';

import React, { useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Database, Project } from '@/lib/db/generated';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/Logo';
import { getProjectById } from '@/lib/actions/database/cache-actions';
import { MobileSidebar } from './Sidebar';
import { Separator } from '@/components/ui/separator';
import CreateProjectDialog from './CreateProjectDialog';

type Props = { 
  projects: ProjectWithDatabases[], 
  sharedProjects: ProjectWithDatabases[]  
};
type ProjectWithDatabases = Project & { databases: Database[] };

export default function BreadcrumbHeader({ projects, sharedProjects }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive IDs from the URL
  const curId = useMemo(() => pathname.split('/')[2] ?? '', [pathname]);
  const dbId = useMemo(() => pathname.split('/')[4] ?? '', [pathname]);

  // Find the current project
  const currentProject = useMemo(
    () => [...projects, ...sharedProjects].find(p => p.id === curId) ?? null,
    [projects, sharedProjects, curId]
  );

  // Fetch project details with databases using React Query
  const { data: projectWithDatabases, isLoading: isLoadingDatabases } = useQuery({
    queryKey: ['project', curId, 'databases'],
    queryFn: async () => {
      if (!curId) return null;
      return await getProjectById(curId);
    },
    enabled: !!curId && !!dbId, // Only fetch when we have both curId and dbId
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Find the current database
  const currentDatabase = useMemo(() => {
    if (!projectWithDatabases?.databases || !dbId) return null;
    return projectWithDatabases.databases.find(db => db.id === dbId) ?? null;
  }, [projectWithDatabases, dbId]);

  const [openProject, setOpenProject] = useState(false);
  const [openDatabase, setOpenDatabase] = useState(false);
  const [view, setView] = useState<'my' | 'shared'>('my');

  return (
    <div className="flex items-center gap-3 w-full z-0">
      {/* Logo on the far left - hidden on mobile since MobileSidebar has it */}
      <div className="hidden md:block mr-2">
        <Logo text={false} iconSize={32}/>
      </div>
      
      {/* Mobile Sidebar - only shows on mobile */}
      <MobileSidebar />
      
      <HeaderSeperator />
      
      <div className='flex items-center gap-0'>
        
        <HeaderRouteName 
          route={`/proj/${curId}`}
          current={currentProject}
        />

        <Popover open={openProject} onOpenChange={setOpenProject}>
          <PopoverTrigger>
            <ComboboxButton 
                expanded={openProject}
              />
          </PopoverTrigger>

          <PopoverContent className="w-[260px] p-0 z-100">
            <Command>
              <CommandInput placeholder="Search project..." className="h-9" />
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
                    My Projects
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

                <CommandEmpty>No projects found.</CommandEmpty>

                <CommandGroup>
                  {(view === 'my' ? projects : sharedProjects).map((project) => {
                    const selected = project.id === curId;
                    return (
                      <CommandItem
                        key={project.id}
                        value={project.id}
                        onSelect={(nextId) => {
                          setOpenProject(false);
                          if (nextId !== curId) router.push(`/proj/${nextId}`);
                        }}
                      >
                        {project.name}
                        <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>

              <Separator />
              {view === "my" && (
                <CommandGroup>
                  <CommandItem>
                    <CreateProjectDialog triggerText="New Project" />
                  </CommandItem>
                </CommandGroup>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {/* Project Selector */}

      {/* Database Selector - Only show if dbId exists */}
      {dbId && (
        <>
          <HeaderSeperator />

          <div className='flex items-center gap-0'>
            
            <HeaderRouteName 
              route={`/proj/${curId}/database/${dbId}`}
              current={currentDatabase}
            />
            
            <Popover open={openDatabase} onOpenChange={setOpenDatabase}>
              <PopoverTrigger>
                <ComboboxButton 
                  expanded={openDatabase}
                />
              </PopoverTrigger>

              <PopoverContent className="w-[260px] p-0 z-100">
                <Command>
                  <CommandInput placeholder="Search database..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No databases found.</CommandEmpty>

                    <CommandGroup>
                      {projectWithDatabases?.databases?.map((db) => {
                        const selected = db.id === dbId;
                        return (
                          <CommandItem
                            key={db.id}
                            value={db.id}
                            onSelect={(nextDbId) => {
                              setOpenDatabase(false);
                              if (nextDbId !== dbId) {
                                router.push(`/proj/${curId}/database/${nextDbId}`);
                              }
                            }}
                          >
                            {db.name}
                            <Check className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  );
}

function ComboboxButton(
  { expanded }: { expanded: boolean }
) {
  return (
    <div 
      role="combobox" 
      aria-expanded={expanded} 
      className="bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 w-fit justify-between items-center border-none p-2! shadow-none text-2xl text-muted-foreground hover:text-foreground rounded-md"
    >
      <ChevronsUpDown className="opacity-50 p-0" />
    </div>

  )
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
      className='text-xl text-muted-foreground rounded-lg dark:hover:bg-gray-900 hover:bg-gray-100  transition-colors duration-200 p-2'
    >
      {current ? current.name : (
        <div className="px-0">
          <Skeleton className="h-8 w-32 bg-gray-200" />
        </div>
      )}
    </Link>
  )
}

function HeaderSeperator() {
  return (
    <div className="hidden md:block h-5 w-0.5 bg-black/10 rotate-12 dark:bg-white/20" />
  )
}