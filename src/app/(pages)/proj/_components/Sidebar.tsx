'use client'

import { MenuIcon } from 'lucide-react'
import React, { useState } from 'react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
// Import both sets of routes
import { routes as dbRoutes } from '@/lib/constants/databaseSidebar'
import { routes as projRoutes } from '@/lib/constants/sidebar' 

// Import tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import path from 'path'


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
  
  // 1. Decide which routes and base path to use dynamically
  const inDbView = isInDatabaseView(pathname);
  
  const currentRoutes = inDbView ? dbRoutes : projRoutes;
  
  // Base path calculation is dynamic:
  const segments = pathname.split('/').filter(Boolean);
  const basePath = inDbView 
    ? '/' + segments.slice(0, 4).join('/') // Database Base: /proj/P_ID/database/D_ID
    : '/' + segments.slice(0, 2).join('/'); // Project Base: /proj/P_ID


  // Helper functions adapted for this dynamic setup
  const isRouteActive = (routeHref: string, currentPathname: string, basePath: string) => {
    const targetPath = routeHref === "" ? basePath : `${basePath}${routeHref}`;
    
    // Check for exact match for the home route, otherwise use startsWith for sub-routes
    
    // For all other routes, check if the current path starts with the target path
    // and handle the trailing slash case to prevent partial matches like /dashboard matching /dashboards
    return currentPathname == targetPath;
  }

  const constructPath = (basePath: string, routeHref: string) => {
    if (routeHref === "") return basePath;
    return `${basePath}${routeHref.startsWith('/') ? '' : '/'}${routeHref}`;
  }

  // --- Render the narrow, icon-only sidebar ---
  return (
    <TooltipProvider>
      {/* Set a consistent narrow width (e.g., 70px) */}
      <div className='hidden relative md:block w-[70px] h-screen overflow-hidden bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2 border-separate'>
        
        {/* Logo Area */}
        <div className="flex items-center justify-center border-b border-separate p-4 h-[66px] min-h-[66px] max-h-[66px]">
          <Logo text={false}/> {/* Assumes your Logo component takes a text prop */}
        </div>

        {/* Navigation Links (Icons only + Tooltips) */}
        <div className='flex flex-col p-2 gap-2 items-center'>
          {currentRoutes.map((route) => {
            const isActive = isRouteActive(route.href, pathname, basePath)
            const targetPath = constructPath(basePath, route.href)
            
            return (
              <Tooltip key={route.href}>
                <TooltipTrigger asChild className='w-12 h-12'>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      router.push(targetPath)
                    }} 
                    className={`
                      ${isActive
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white' 
                        : 'text-black hover:bg-indigo-200 dark:text-white dark:hover:bg-secondary/50'
                      }
                    `}
                  >
                    <route.icon scale={5} />
                  </Button> 
                </TooltipTrigger>
                <TooltipContent side="right" className='text-md'>
                  {route.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
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
  const currentRoutes = inDbView ? dbRoutes : projRoutes;
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
                {currentRoutes.map((route) => {
                  const isActive = isRouteActive(route.href, pathname, basePath)
                  const targetPath = constructPath(basePath, route.href)
                  
                  return (
                    // This uses the full-width mobile button style (text + icon)
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
