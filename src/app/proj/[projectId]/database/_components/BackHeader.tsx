"use client"

import { ArrowLeftIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import React from 'react'

const BackHeader = ({ schema, table }: { schema: string, table: string }) => {
    const router = useRouter()
    const pathname = usePathname()

  return (
    <header className="flex p-2 items-center-safe gap-2 h-16 min-h-16 max-h-16 border-b-2">
    <ArrowLeftIcon 
        size={24}
        className="cursor-pointer"
        onClick={() => {
        router.push(`${pathname}?schema=${schema}`)
        }}
    />
    <p className="text-2xl font-semibold">{table}</p>
    </header>
  )
}

export default BackHeader