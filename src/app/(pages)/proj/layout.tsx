import BreadcrumbHeader from '@/app/(pages)/proj/_components/BreadcrumbHeader'
import Sidebar from './_components/Sidebar'
import { ModeToggle } from '@/app/(pages)/proj/_components/ThemeModeToggle'
import { Separator } from '@/components/ui/separator'
import UserButton from './_components/UserButton'
import React from 'react'
import { getUser, getUserById } from '@/lib/actions/auth/getUser'

async function layout({ children }: { children: React.ReactNode }) {

  const u = await getUser()
  if (!u) throw new Error('');
  const user = await getUserById(u.id)
  if (!user) throw new Error("");


  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="fixed top-0 left-0 right-0 z-100 bg-gray-50 border-b dark:bg-gray-950 dark:text-white">
          <div className="flex items-center justify-between py-3 px-5 h-[65px]">
            <BreadcrumbHeader
              projects={user.projects}
              sharedProjects={user.SharedProjects}
            />
            <div className="gap-2 flex items-center">
              <ModeToggle />
              <UserButton />
            </div>
          </div>
        </header>

        {/* push content below header */}
        <div className="pt-[65px]">
          <div className="min-w-full max-w-full w-full">
            <div className="container text-accent-foreground min-w-full max-w-full w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )


}

export default layout