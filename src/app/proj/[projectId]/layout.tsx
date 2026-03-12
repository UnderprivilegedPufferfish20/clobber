
import Sidebar from '../_components/Sidebar'
import UserButton from '../_components/UserButton'
import React, { Suspense } from 'react'
import BreadcrumbHeader from '../_components/BreadcrumbHeader'
import { ModeToggle } from '../_components/ThemeModeToggle'
import Loader from '@/components/Loader'
import { getUser } from '@/lib/actions/auth'
import { getUserById } from '@/lib/actions/auth/cache-actions'
import { get_institution_by_id, getProjectById } from '@/lib/actions/database/cache-actions'


async function layout({ 
  children, 
  params 
}: { 
  children: React.ReactNode 
} & PageProps<"/proj/[projectId]">) {
  const p = await params
  const u = await getUser()
  if (!u) throw new Error("NO USER");
  const user = await getUserById(u.id)
  if (!user) throw new Error("NO USER");
  const proj = await getProjectById(p.projectId)
  if (!proj) throw new Error("");
  const inst = await get_institution_by_id(proj.institution.id)
  if (!inst) throw new Error("No inst");

  return (
    <Suspense fallback={<Loader sz={168}/>}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 fullheight">
          <header className="fixed top-0 left-0 right-0 z-100 bg-secondary border-b-2">
            <div className="flex items-center justify-between py-3 px-5 h-16.25">
              <BreadcrumbHeader
                current_institution={inst}
                current_project={proj}
                institutions={[...user.ownedInstitutions, ...user.collaborator]}
                user={user}
              />
              <div className="gap-2 flex items-center">
                <ModeToggle />
                <UserButton />
              </div>
            </div>
          </header>

          {/* push content below header */}
          <div className="16.25 text-accent-foreground w-full h-full overflow-hidden bg-background">
            {children}
          </div>
        </div>
      </div>
    </Suspense>
  )


}

export default layout