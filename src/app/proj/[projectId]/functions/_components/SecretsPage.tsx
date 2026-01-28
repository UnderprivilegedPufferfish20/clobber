"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { EdgeFunctionSecretType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { InboxIcon, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react'
import SecretCard from './cards/SecretCard';

const page = ({
    data
}: {
    data: EdgeFunctionSecretType[]
}) => {

    const [searchTerm, setSearchTerm] = useState("");
    const [open, setOpen] = useState(false);
  
  
    const filteredData = useMemo(() => {
      if (!data) return [];
      const q = searchTerm.trim().toLowerCase();
      if (!q) return data;
  
      return data.filter((i: any) =>
        i.function_name.toLowerCase().includes(q)
      );
    }, [searchTerm, data]);
  
    const isNoData = filteredData.length === 0;
    const isSearchActive = !!searchTerm.trim();

  return (
    <>
    
      <div className="fullscreen flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl">Secrets</h1>
            <p className="text-sm text-muted-foreground mt-1">
                Sensitive data to be used in your edge functions
            </p>
          </div>

          <Button
            onClick={() => {
                
            }}
            variant={"default"}
          >
            Create Secret
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 mb-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-72"
                placeholder={`Search secrets`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          <div className="text-xs text-muted-foreground">
            {filteredData.length} Secrets
          </div>
        </div>

        <Separator className="mb-6" />

        {/* CONTENT */}
        {isNoData && isSearchActive ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Search size={72} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">No matches</h2>
              <p className="text-muted-foreground text-sm">
                No secrets match “{searchTerm.trim()}”.
              </p>
            </div>
            <Button
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          </div>
        ) : isNoData ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <InboxIcon size={96} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">No Secret</h2>
              <p className="text-muted-foreground text-sm">
                Create Secret
              </p>
            </div>

            <Button
              onClick={() => setOpen(true)}
              variant={"default"}
            >
              Create Secret
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}
          >
            {filteredData.map((i: any) => (
              <SecretCard
                key={Math.random()}
                {...i}
              />
            ))}
          </div>
        )}
      </div>
      </>
  )
}

export default page

