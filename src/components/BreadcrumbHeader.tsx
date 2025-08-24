'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MobileSidebar } from '@/app/(pages)/proj/_components/Sidebar'
import { Project } from '@/lib/db/generated'
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from './ui/separator';
import CreateProjectDialog from '@/app/(pages)/proj/_components/CreateProjectDialog';
import Loader from './Loader';

type Props = { projects: Project[] };

export default function BreadcrumbHeader({ projects }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive the current project id from the URL (single source of truth)
  const curId = React.useMemo(() => pathname.split('/')[2] ?? '', [pathname]);

  // Find the current project object safely
  const currentProject = React.useMemo(
    () => projects.find(p => p.id === curId) ?? null,
    [projects, curId]
  );

  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <MobileSidebar />
      <h1 className="text-muted-foreground text-xl">Working in:</h1>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[220px] justify-between">
            {currentProject ? currentProject.name : <Loader />}
            <ChevronsUpDown className="opacity-50" />
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
                        setOpen(false);
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
                <Plus size={12} className="mr-2" />
                <CreateProjectDialog triggerText="New Project" />
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
