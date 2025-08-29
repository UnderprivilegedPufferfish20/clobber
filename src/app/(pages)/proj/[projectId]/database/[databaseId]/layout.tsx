'use client'

import { databaseTopbar } from '@/lib/constants/topbar';
import React from 'react'
import PageHeader from '../../_components/PageHeader';
import { getDatabaseById } from '@/lib/actions/database/getDatabaseById';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import DatabasePageFooter from './_components/DatabasePageFooter';


const DatabaseLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const databaseId = pathname.split('/')[4];

  const { data, isPending, refetch } = useQuery({
    queryKey: ['getDatabase', databaseId],
    queryFn: () => getDatabaseById(databaseId),
  });

  const tables = data?.tables ?? [];

  return (
    <div className="w-full min-h-screen flex flex-col bg-background">
      {/* Header Section */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex flex-col gap-4">
          {isPending ? (
            <div className="px-4">
              <Skeleton className="h-10 w-36" />
            </div>
          ) : (
            data && <h1 className="text-4xl px-4 font-semibold">{data.name}</h1>
          )}
          <PageHeader content={databaseTopbar} />
        </div>
        <Separator className="mt-4" />
      </div>

      {/* Content Area - increased bottom padding for tab navigation */}
      <div
        className={cn(
          'flex-1 px-4 pb-20 transition-all duration-300 ease-out',
        )}
      >

        <div className={'transition-all duration-300 ease-out h-full'}>
          {children}
        </div>
      </div>

      <DatabasePageFooter 
        databaseId={databaseId}
        isPending={isPending}
        tables={tables}
      />

    </div>
  );
};

export default DatabaseLayout;