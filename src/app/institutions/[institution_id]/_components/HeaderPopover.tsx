'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { BuildingIcon, Check, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Institution } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';
import TextInputDialog from '@/components/TextInputDialog';
import { create_institution } from '@/lib/actions/database/actions';

const HeaderPopover = ({
  owned,
  other,
  user_id,
  curId
}: {
  owned: Institution[],
  other: Institution[],
  user_id: string,
  curId: string 
}) => {
  const [view, setView] = useState<"my" | "shared">("my")
  const router = useRouter()
  
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")

  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild className='hover:bg-background cursor-pointer'>
          <Button
            size={"icon-lg"}
            className='cursor-pointer hover:bg-background bg-transparent text-primary'
          >
            <ChevronsUpDownIcon className='w-6 h-6'/>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-65 p-0 z-100" align='start'>
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

              <CommandEmpty>No Institutions found.</CommandEmpty>

              <CommandGroup>
                {(view === 'my' ? owned : other).map((project) => {
                  const selected = project.id === curId;
                  return (
                    <CommandItem
                      key={project.id}
                      value={project.id}
                      onSelect={(nextId) => {
                        setOpen(false);
                        if (nextId !== curId) router.push(`/institutions/${nextId}`);
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
                <Button
                  variant={"ghost"}
                  className='fullwidth flex items-center justify-start gap-2 p-1! cursor-pointer'
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <PlusIcon className='w-5 h-5'/>
                  Create Institution
                </Button>
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>


      <TextInputDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        value={newOrgName}
        onValueChange={setNewOrgName}
        toastId='new-org'
        successMessage="Institution Created"
        loadingMessage='Creating...'
        headerTitle='Create Institution'
        headerIcon={BuildingIcon}
        errorMessage='Failed to create Institution'
        action={create_institution}
        actionArgs={[newOrgName, user_id]}
      />
    </>
    
  )
}

export default HeaderPopover