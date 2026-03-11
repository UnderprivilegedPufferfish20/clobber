"use client";

import TextInputDialog from '@/components/TextInputDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserById } from '@/lib/actions/auth/cache-actions';
import { create_institution } from '@/lib/actions/database/actions';
import { cn } from '@/lib/utils';
import { BuildingIcon, InboxIcon, PlusIcon, Search } from 'lucide-react';
import Link from 'next/link';
import React, { Fragment, useMemo, useState } from 'react';
import { fa } from 'zod/v4/locales';

const InstiPage = ({
  user
}: {
  user: Awaited<ReturnType<typeof getUserById>>
}) => {
  if (!user) throw new Error("Must be user");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")

  const [searchStr, setSearchStr] = useState('');

  // 1. Filter Logic for both sections
  const filteredOwned = useMemo(() => {
    return user.ownedInstitutions.filter(i => 
      i.name.toLowerCase().includes(searchStr.toLowerCase())
    );
  }, [searchStr, user.ownedInstitutions]);

  const filteredOther = useMemo(() => {
    return user.collaborator.filter(i => 
      i.name.toLowerCase().includes(searchStr.toLowerCase())
    );
  }, [searchStr, user.collaborator]);

  const isSearchActive = !!searchStr.trim();
  const totalResults = filteredOwned.length + filteredOther.length;
  const isNoMatches = isSearchActive && totalResults === 0;

  return (
    <>    
      <div className="fullscreen flex flex-col gap-1 overflow-y-scroll hide-scrollbar">
        {/* Header & Search */}
        <div className='flex flex-col gap-4 p-2'>
          <h1 className='text-2xl font-bold p-2 mb-8'>Institutions</h1>
          <div className='fullwidth flex items-center justify-between p-2 mb-2'>
            <div className='relative'>
              <Input 
                placeholder="Search for institution..."
                value={searchStr}
                className='w-md min-w-md max-w-md'
                onChange={e => setSearchStr(e.target.value)}
              />
              {isSearchActive && (
                <p className='absolute left-0 -bottom-7 pl-1 text-sm text-muted-foreground'>
                  {totalResults} results
                </p>
              )}
            </div>

            <Button 
              className='flex items-center gap-2' 
              variant={"default"}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon className='w-5 h-5'/>
              Create Institution
            </Button>
          </div>
        </div>

        {/* Global "No Matches" State */}
        {isNoMatches ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
            <Search size={72} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">No matches</h2>
              <p className="text-muted-foreground text-sm">
                No institutions match “{searchStr.trim()}”.
              </p>
            </div>
            <Button onClick={() => setSearchStr("")}>Clear Search</Button>
          </div>
        ) : (
          <>
            {/* Owned Section */}
            {(filteredOwned.length > 0 || !isSearchActive) && (
              <div className="flex flex-col gap-2 p-2">
                <h1 className="text-xl font-bold pl-2">Owned</h1>
                <div className="flex flex-wrap gap-2 p-2">
                  {filteredOwned.length > 0 ? (
                    filteredOwned.map(i => (
                      <Card key={i.id} id={i.id} name={i.name} plan={i.plan} project_count={i._count.projects} />
                    ))
                  ) : (
                    <EmptyState icon={<InboxIcon className='w-16 h-16'/>} message="No owned institutions" />
                  )}
                </div>
              </div>
            )}

            {/* Other Section */}
            {(filteredOther.length > 0 || !isSearchActive) && (
              <div className="flex flex-col gap-2 p-2">
                <h1 className="text-xl font-bold pl-2">Other</h1>
                <div className="flex flex-wrap gap-2 p-2">
                  {filteredOther.length > 0 ? (
                    filteredOther.map(i => (
                      <Card key={i.id} id={i.id} name={i.name} plan={i.plan} project_count={i._count.projects} />
                    ))
                  ) : (
                    <EmptyState icon={<InboxIcon className='w-16 h-16'/>} message="Not a collaborator" />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TextInputDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        value={newOrgName}
        onValueChange={setNewOrgName}
        toastId='new-org'
        successMessage="Institution Created"
        loadingMessage='Creating...'
        headerTitle='Create Institution'
        headerIcon={BuildingIcon}
        errorMessage='Failed to create Institution'
        action={create_institution}
        actionArgs={[newOrgName, user.id]}
      />
    </>
  );
};

export default InstiPage;

// Reusable Empty State for specific sections
const EmptyState = ({ icon, message }: { icon: React.ReactNode, message: string }) => (
  <div className='flex items-center justify-center text-muted-foreground mx-auto p-4'>
    <div className='flex items-center flex-col gap-2'>
      {icon}
      <p>{message}</p>
    </div>
  </div>
);

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