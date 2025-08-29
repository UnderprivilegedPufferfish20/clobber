'use client'

import { MenuIcon } from 'lucide-react'
import React, { useState } from 'react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { routes } from '@/lib/constants/sidebar'

// Helper function to get the base path (first 3 segments)
const getBasePath = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  return '/' + segments.slice(0, 2).join('/')
}

// Helper function to determine if a route is active
const isRouteActive = (routeHref: string, pathname: string) => {
  // Handle empty/root route specifically
  if (routeHref === "") {
    const basePath = getBasePath(pathname)
    const remainingPath = pathname.replace(basePath, '')
    return remainingPath === '' || remainingPath === '/'
  }
  
  // For other routes, check if pathname ends with the route href
  return pathname.endsWith(routeHref)
}

// Helper function to construct the full path
const constructPath = (basePath: string, routeHref: string) => {
  if (routeHref === "") {
    return basePath
  }
  return basePath + routeHref
}

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const basePath = getBasePath(pathname)

  return (
    <div className='hidden relative md:block min-w-[280px] max-w-[280px] h-screen overflow-hidden w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2 border-separate'>
      <div className="flex items-center justify-center gap-2 border-b-[1px] border-separate p-4">
        <Logo />
      </div>
      <div className='flex flex-col p-2 gap-2'>
        {routes.map((route) => {
          const isActive = isRouteActive(route.href, pathname)
          const targetPath = constructPath(basePath, route.href)
          
          return (
            <button 
              key={route.href}
              onClick={() => {
                router.push(targetPath)
              }} 
              className={`flex p-2 rounded-md justify-start gap-2 bg-transparent text-black hover:bg-indigo-200 ${isActive && '!bg-indigo-500 !text-white'}`}
            >
              <route.icon size={20} />
              {route.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Sidebar;

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const basePath = getBasePath(pathname)
  const router = useRouter()

  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className='container flex items-center justify-between p-8'>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant={'ghost'} size={'icon'}>
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent className='w-[400px] sm:w-[540px]' side='left'>
            <div className="flex flex-col h-full">
              <Logo />
              <div className="flex flex-col gap-1 p-2">
                {routes.map((route) => {
                  const isActive = isRouteActive(route.href, pathname)
                  const targetPath = constructPath(basePath, route.href)
                  
                  return (
                    <button 
                      key={route.href}
                      onClick={() => {
                        router.push(targetPath)
                      }} 
                      className={`flex p-2 rounded-md justify-start gap-2 bg-transparent text-black hover:bg-indigo-200 ${isActive && '!bg-indigo-500 !text-white'}`}
                    >
                      <route.icon size={20} />
                      {route.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}