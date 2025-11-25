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
    <div className="w-full min-h-full flex flex-col bg-background">
      <div
        className={cn(
          'px-4 pb-20 transition-all duration-300 ease-out',
        )}
      >

        <div className="h-full flex justify-center items-center">
          {children}
          <DatabasePageFooter 
            databaseId={databaseId}
            isPending={isPending}
            tables={tables}
          />
        </div>
      </div>


    </div>
  );
};

export default DatabaseLayout;