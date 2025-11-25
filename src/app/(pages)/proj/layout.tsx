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
  const projects = (await getUserById(u.id))!.projects

  return (
    <div
      className='flex h-screen'
    >
      <Sidebar />
      <div className='flex flex-col flex-1 min-h-screen'>
        <header className='flex items-center justify-between px-6 py-4 h-[65px] container'>
          <BreadcrumbHeader projects={projects} />
          <div className='gap-2 flex items-center'> 
            <ModeToggle />
            <UserButton />
          </div>
        </header>
        <Separator />
        <div className='overflow-auto'>
          <div className='flex-1 container text-accent-foreground'>
            {children}
          </div>
        </div>
      </div>

    </div>
  )
}

export default layout