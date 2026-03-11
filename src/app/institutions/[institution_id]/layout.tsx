import { HeaderSeperator } from '@/app/proj/_components/BreadcrumbHeader'
import Logo from '@/components/Logo'
import Link from 'next/link'
import React, { PropsWithChildren, Suspense } from 'react'
import Sidebar from './_components/Sidebar'
import Loader from '@/components/Loader'
import { getUser } from '@/lib/actions/auth'
import { getUserById } from '@/lib/actions/auth/cache-actions'
import prisma from '@/lib/db'
import { Skeleton } from '@/components/ui/skeleton'
import HeaderPopover from './_components/HeaderPopover'

const layout = async ({children, params}: PropsWithChildren & PageProps<"/institutions/[institution_id]">) => {
  const p = await params

  const u = await getUser()

  if (!u) throw new Error("no useer");

  const user = await getUserById(u.id)

  if (!user) throw new Error("No user");

  const current_institution = await prisma.institution.findUnique({ where: { id: p.institution_id } })

  return (
    <Suspense fallback={<Loader sz={168}/>}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 fullheight">
          <header className="fixed top-0 left-0 right-0 z-100 bg-secondary border-b-2">
            <div className="flex items-center justify-between py-3 px-5 h-16.25">
              <div className="flex items-center gap-3 w-full z-0">
          
                <div className="hidden md:block mr-2">
                  <Logo text={false} iconSize={32}/>
                </div>
          
          
          
                <HeaderSeperator />

                <div className='flex items-center gap-0'>
              
                  <Link
                    href={`/institutions/${p.institution_id}`}
                    className='text-xl rounded-lg hover:bg-background transition-colors duration-200 p-2'
                  >
                    {current_institution ? current_institution.name : (
                      <div className="px-0">
                        <Skeleton className="h-8 w-32 bg-gray-200" />
                      </div>
                    )}
                  </Link>
                  
                  <HeaderPopover 
                    other={user.collaborator}
                    owned={user.ownedInstitutions}
                    user_id={user.id}
                    curId={p.institution_id}
                  />
                  
                </div>
              
                
              </div>
            </div>
          </header>

          {/* push content below header */}
          <div className="pt-24 text-accent-foreground w-full h-full overflow-y-scroll bg-background flex justify-center">
            <div className='w-5xl min-w-5xl max-w-5xl'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

export default layout