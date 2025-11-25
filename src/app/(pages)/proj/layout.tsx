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
    <div
      className='flex max-h-full h-full min-h-full'
    >
      <Sidebar />
      <div className='flex flex-col flex-1'>
        <header className='flex items-center justify-between px-6 py-4 h-[65px] container w-full min-w-full max-w-full'>
          <BreadcrumbHeader projects={user.projects} sharedProjects={user.SharedProjects}/>
          <div className='gap-2 flex items-center'> 
            <ModeToggle />
            <UserButton />
          </div>
        </header>
        <Separator />
        <div className='min-w-full max-w-full w-full'>
          <div className='container text-accent-foreground min-w-full max-w-full w-full'>
            {children}
          </div>
        </div>
      </div>

    </div>
  )
}

export default layout