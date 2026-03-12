"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from '@prisma/client';
import { EllipsisVerticalIcon, UserMinus } from 'lucide-react';
import Image from 'next/image';

const MemberCard = ({
    pfpUrl,
    email,
    name,
    owner = false
}: User & { owner: boolean }) => {
  return (
    <div className={`border flex items-center justify-between p-4 pl-6 ${owner && "text-muted-foreground"}`}>
        <div className='flex items-center gap-12'>
            <Image 
                alt='pfp'
                src={pfpUrl}
                className={`rounded-full border ${owner && "opacity-70"}`}
                width={36}
                height={36}

            />

            <p>{name}</p>

            <p>{email}</p>
        </div>

        <div className='flex items-center gap-4'>
            {owner && (
                <p className='text-muted-foreground'>(you)</p>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger disabled={owner}>
                    <EllipsisVerticalIcon className='w-5 h-5'/>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                        className='flex items-center gap-2'
                    >
                        <UserMinus />
                        Remove From Team
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

    </div>
  )
}

export default MemberCard