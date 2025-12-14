'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DatabaseSidebar = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  return (
    <aside className='bg-yellow-200 w-74 min-w-74 max-w-74 flex flex-col items-center h-full min-h-full max-h-full'>
      This is sidebar
    </aside>
  )
}

export default DatabaseSidebar