"use client";

import { usePathname, useRouter } from 'next/navigation';
import React from 'react'
import Sidebar from './_components/Sidebar';
import Loader from '@/components/Loader';

const page = () => {

    const pathname = usePathname()
    const router = useRouter()

    router.push(`${pathname.split("/").slice(0,5).join("/")}/overview`)

  
}

export default page