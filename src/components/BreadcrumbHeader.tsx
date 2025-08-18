'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb'
import { MobileSidebar } from '@/components/Sidebar'

const BreadcrumbHeader = () => {
  const pathname = usePathname()
  const paths = pathname === '/' ? [""] : pathname?.split('/')

  return (
    <div className="flex items-center flex-start">
      <MobileSidebar />
      <Breadcrumb>
        <BreadcrumbList>
          {paths.map((path, idx) => (
            path !== 'h' && (
              <React.Fragment key={idx}>
                <BreadcrumbItem>
                  <BreadcrumbLink className='capitalize' href={`/${path}`}>
                    {path === '' ? "home" : path}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {idx < paths.length - 1 && (
                  <BreadcrumbSeparator>
                    &gt;
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            )
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default BreadcrumbHeader