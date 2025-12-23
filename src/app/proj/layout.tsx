
import Sidebar from './_components/Sidebar'
import UserButton from './_components/UserButton'
import React from 'react'
import { getUser, getUserById } from '@/lib/actions/auth'
import BreadcrumbHeader from './_components/BreadcrumbHeader'
import { ModeToggle } from './_components/ThemeModeToggle'

async function layout({ children }: { children: React.ReactNode }) {



  const u = await getUser()
  if (!u) throw new Error('');
  const user = await getUserById(u.id)
  if (!user) throw new Error("");




  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 fullheight">
        <header className="fixed top-0 left-0 right-0 z-100 bg-gray-50 border-b dark:bg-black/5 dark:text-white">
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
        <div className="pt-[65px] text-accent-foreground w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )


}

export default layout