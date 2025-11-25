'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MobileSidebar } from '@/app/(pages)/proj/_components/Sidebar';
import { Project } from '@/lib/db/generated';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from '../../../../components/ui/separator';
import CreateProjectDialog from '@/app/(pages)/proj/_components/CreateProjectDialog';
import Loader from '../../../../components/Loader';
import { getProjectById } from '@/lib/actions/projects/getProjectById';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { projects: Project[] };

export default function BreadcrumbHeader({ projects }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive IDs from the URL
  const curId = React.useMemo(() => pathname.split('/')[2] ?? '', [pathname]);
  const dbId = React.useMemo(() => pathname.split('/')[4] ?? '', [pathname]);

  // Find the current project
  const currentProject = React.useMemo(
    () => projects.find(p => p.id === curId) ?? null,
    [projects, curId]
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
  const currentDatabase = React.useMemo(() => {
    if (!projectWithDatabases?.databases || !dbId) return null;
    return projectWithDatabases.databases.find(db => db.id === dbId) ?? null;
  }, [projectWithDatabases, dbId]);

  const [openProject, setOpenProject] = React.useState(false);
  const [openDatabase, setOpenDatabase] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <MobileSidebar />
      <div className='flex items-center gap-1'>
        <Link
          href={`/proj/${curId}`}
          className='text-xl text-black'
        >
          {currentProject ? currentProject.name : <Loader />}
        </Link>
        <Popover open={openProject} onOpenChange={setOpenProject}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={openProject} 
              className="w-fit justify-between items-center border-none shadow-none text-2xl !p-0 !px-0"
            >
              <ChevronsUpDown className="opacity-50 p-0" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[260px] p-0">
            <Command>
              <CommandInput placeholder="Search project..." className="h-9" />
              <CommandList>
                <CommandEmpty>No projects found.</CommandEmpty>

                <CommandGroup>
                  {projects.map((project) => {
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

              <CommandGroup>
                <CommandItem>
                  <CreateProjectDialog triggerText="New Project" />
                </CommandItem>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {/* Project Selector */}

      {/* Database Selector - Only show if dbId exists */}
      {dbId && (
        <>
          <span className="text-2xl text-muted-foreground mx-4">/</span>

          <div className='flex items-center gap-2'>
            <Link
              href={`/proj/${curId}/database/${dbId}`}
              className='text-xl text-black'
            >
              {currentDatabase ? currentDatabase.name : (
                <div className="px-0">
                  <Skeleton className="h-8 w-32" />
                </div>
              )}
            </Link>
            <Popover open={openDatabase} onOpenChange={setOpenDatabase}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={openDatabase} 
                  className="w-fit justify-between items-center border-none shadow-none text-2xl !p-0 !px-0"
                >
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[260px] p-0">
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