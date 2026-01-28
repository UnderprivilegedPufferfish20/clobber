'use client';

import { EdgeFunctionSecretType } from '@/lib/types';
import { cn } from '@/lib/utils';
import React from 'react'

const SecretCard = ({
    createdAt,
    key,
    updatedAt,
    value
}: EdgeFunctionSecretType) => {
  return (
    <>
        <div 
            className={cn(
                "group rounded-xl border bg-background p-4",
                "transition-all duration-150",
                "hover:-translate-y-0.5 hover:shadow-md",
                "hover:border-foreground/20",
                "flex flex-col gap-4"
            )}
        >
            <div className='flex items-center justify-between'>
                <h1 className='truncate'>{key}</h1>
                <p className='text-muted-foreground truncate'>{createdAt}</p>
            </div>
            <p className='text-muted-foreground truncate'>{value}</p>
        </div>
    </>
  )
}

export default SecretCard