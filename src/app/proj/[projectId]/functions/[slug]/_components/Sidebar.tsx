"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react'
import path from 'path';
import { ArrowLeft } from 'lucide-react';

const Sidebar = () => {
    const router = useRouter()
    const pathname = usePathname()
    const routes = ["Overview", "Monitoring", "Logs", "Calls", "Test"]

  return (
    <div className='flex flex-1 flex-col gap-4 text-lg fullheight w-56 min-w-56 max-w-56 border-r-2'>
        <header className='p-4 flex items-center gap-2 border-b'>
            <ArrowLeft
                className='text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer' 
                size={20}
                onClick={() => router.push(`${pathname.split("/").slice(0,4).join("/")}`)}
            />
            <h3 className='text-lg font-semibold text-white'>{pathname.split("/")[4]}</h3>
        </header>
        <div className='flex flex-col gap-2 p-2'>
            {routes.map(r => (
                <Link
                    key={r} 
                    href={`${pathname.split("/").slice(0,5).join("/")}/${r.toLowerCase()}`}
                    className={`${pathname.includes(r.toLowerCase()) && "text-foreground!"} cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-300`}
                >
                    {r}
                </Link>
            ))}
        </div>
    </div>
  )
}

export default Sidebar