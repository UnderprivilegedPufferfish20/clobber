'use client'

import { MenuIcon, ChevronLeft, ChevronRight, LogInIcon, ArrowLeftToLine, ArrowRightFromLine } from 'lucide-react'
import React, { useState } from 'react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'


// Import tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DatabaseSidebarRoutes, SidebarRoutes } from '@/lib/constants'


/**
 * Determines if we are in the database view based on the URL segments.
 * URL: /proj/P_ID/database/D_ID/...
 */
const isInDatabaseView = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean);
  // Check if the 3rd segment exists and is exactly 'database'
  return segments.length >= 4 && segments[2] === 'database';
};


const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 1. Decide which routes and base path to use dynamically
  const inDbView = isInDatabaseView(pathname);
  
  const currentRoutes = inDbView ? DatabaseSidebarRoutes : SidebarRoutes;
  
  // Base path calculation is dynamic:
  const segments = pathname.split('/').filter(Boolean);
  const basePath = inDbView 
    ? '/' + segments.slice(0, 4).join('/') // Database Base: /proj/P_ID/database/D_ID
    : '/' + segments.slice(0, 2).join('/'); // Project Base: /proj/P_ID


  // Helper functions adapted for this dynamic setup
  const isRouteActive = (routeHref: string, currentPathname: string, basePath: string) => {
    const targetPath = routeHref === "" ? basePath : `${basePath}${routeHref}`;
    return currentPathname == targetPath;
  }

  const constructPath = (basePath: string, routeHref: string) => {
    if (routeHref === "") return basePath;
    return `${basePath}${routeHref.startsWith('/') ? '' : '/'}${routeHref}`;
  }

  // --- Render the sidebar with expand toggle at the bottom ---
  return (
    <TooltipProvider>
      <div 
        className={`bg-gray-50 dark:bg-black/5 dark:text-white hidden mt-[65px] md:flex flex-col justify-between overflow-y-clip text-muted-foreground border-r-2 border-separate transition-all duration-300 sticky top-0
        ${isExpanded ? 'w-60 items-stretch' : 'w-[70px] items-center'}`}
      >

        {/* Navigation Links */}
        <div className='bg-gray-50 dark:bg-black/5 dark:text-white relative flex flex-col p-2 gap-2 items-start pt-4 w-full'>
          {currentRoutes.map((route) => {
            const isActive = isRouteActive(route.href, pathname, basePath)
            const targetPath = constructPath(basePath, route.href)
            
            return isExpanded ? (
              // Expanded view with labels
              <Button
                key={route.href}
                variant="ghost"
                onClick={() => router.push(targetPath)} 
                className={`w-full justify-start gap-3 h-12 py-2! ${
                  isActive
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                    : 'text-black hover:bg-indigo-200! dark:text-white dark:hover:text-black!'
                }`}
              >
                <route.icon size={32} className='dark:hover:fill-black'/>
                <span className='font-semibold text-lg'>{route.label}</span>
              </Button>
            ) : (
              // Collapsed view with tooltips
              <Tooltip key={route.href}>
                <TooltipTrigger asChild className='w-12 h-12'>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(targetPath)} 
                    className={`${
                      isActive
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                        : 'text-black hover:bg-indigo-200! dark:text-white dark:hover:text-black!'
                    }`}
                  >
                    <route.icon size={20} />
                  </Button> 
                </TooltipTrigger>
                <TooltipContent side="right" className='text-md'>
                  {route.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Bottom expand / collapse control */}
        <div className="w-full p-2 pb-4 flex">
          {isExpanded ? (
            <Button
                variant="ghost"
                onClick={() => setIsExpanded(false)} 
                className={`w-full justify-start gap-3 h-12 hover:bg-indigo-200`}
              >
                <ArrowLeftToLine className="h-4 w-4" />
                <span>Collapse sidebar</span>
              </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setIsExpanded(true)} 
                  className={`w-full justify-center gap-3 h-12 hover:bg-indigo-200`}
                >
                  <ArrowRightFromLine className="h-4 w-4" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="right" className='text-md'>
                Expand Sidebar
              </TooltipContent>
            </Tooltip>

          )}
        </div>

      </div>
    </TooltipProvider>
  )
}

export default Sidebar;


// MobileSidebar needs the same dynamic logic for routes/basePath
export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  const inDbView = isInDatabaseView(pathname);
  const currentRoutes = inDbView ? DatabaseSidebarRoutes : SidebarRoutes;
  const segments = pathname.split('/').filter(Boolean);
  const basePath = inDbView 
    ? '/' + segments.slice(0, 4).join('/') 
    : '/' + segments.slice(0, 2).join('/');

  const isRouteActive = (routeHref: string, currentPathname: string, basePath: string) => {
    const targetPath = routeHref === "" ? basePath : `${basePath}${routeHref}`;
    return currentPathname.startsWith(targetPath);
  }

  const constructPath = (basePath: string, routeHref: string) => {
    if (routeHref === "") return basePath;
    return `${basePath}${routeHref.startsWith('/') ? '' : '/'}${routeHref}`;
  }

  return (
    <div className="block border-separate bg-background md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant={'ghost'} size={'icon'}>
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent className='w-[400px] sm:w-[540px]' side='left'>
          <div className="flex flex-col h-full">
            <Logo />
            <div className="flex flex-col gap-1 p-2 mt-4">
              {currentRoutes.map((route) => {
                const isActive = isRouteActive(route.href, pathname, basePath)
                const targetPath = constructPath(basePath, route.href)
                
                return (
                  <button 
                    key={route.href}
                    onClick={() => {
                      router.push(targetPath)
                      setIsOpen(false)
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
    </div>
  )
}
