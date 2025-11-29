'use client';

import { Database, TableIcon, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import CreateTableDialog from './CreateTableDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Table } from '@/lib/db/generated';
import { cn } from '@/lib/utils';

const DatabasePageFooter = ({
  isPending,
  databaseId,
  tables,
}: {
  isPending: boolean,
  databaseId: string,
  tables: Table[],
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTable = searchParams.get('table') || '';

  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    setActiveTab(currentTable);
  }, [currentTable]);

  async function setTable(tabValue: string) {
    if (tabValue === activeTab) return;
    setActiveTab(tabValue);

    const params = new URLSearchParams(searchParams);
    params.set('table', tabValue);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Helper function to check if a table is temporary (optimistic)
  const isTemporaryTable = (tableId: string) => tableId.startsWith('temp-');

  return (
    <div className={'hidden fixed bottom-0 left-[70px] right-0 border-t bg-white backdrop-blur z-50 h-16'}>
      <CreateTableDialog 
        databaseId={databaseId}
        triggerText='Create your first table'
      />
      <div className="h-full flex items-center justify-start shrink-0 p-2 px-[78px]">
        {isPending ? (
          <div className="flex gap-4 w-full">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-36" />
            ))}
          </div>
        ) : tables.length > 0 ? (
            <div className="flex gap-1 max-w-full overflow-x-auto scrollbar-hide h-full justify-start">
              {tables.map((table) => {
                const isActive = activeTab === table.id;
                const isTemp = isTemporaryTable(table.id);
                return (
                  <button
                    key={table.id}
                    onClick={() => setTable(table.id)}
                    disabled={isTemp}
                    className={cn(
                      'flex items-center gap-2 rounded-lg min-w-0 flex-shrink-0 px-4 transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                      isTemp && 'opacity-60 cursor-wait'
                    )}
                  >
                    {isTemp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TableIcon width={24} height={24}/>
                    )}
                                        
                    <span className={cn(
                      'text-sm font-medium truncate max-w-[80px]',
                      isTemp && 'italic'
                    )}>
                      {table.name}
                    </span>
                  </button>
                );
              })}
            </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center mx-auto">
            <Database className="w-6 h-6 text-muted-foreground/50" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">No tables yet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DatabasePageFooter