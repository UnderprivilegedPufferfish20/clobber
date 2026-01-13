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


const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  
  // Base path calculation is dynamic:
  const segments = pathname.split('/').filter(Boolean);
  const basePath = '/' + segments.slice(0, 2).join('/'); // Project Base: /proj/P_ID


  // Helper functions adapted for this dynamic setup
  const isRouteActive = (routeHref: string, currentPathname: string, basePath: string) => {
    const targetPath = routeHref === "" ? basePath : `${basePath}${routeHref}`;
    return currentPathname == targetPath;
  }

  const constructPath = (basePath: string, routeHref: string) => {
    if (routeHref === "") return basePath;
    return `${basePath}${routeHref.startsWith('/') ? '' : '/'}${routeHref}`;
  }

  // Render function for a single route, handling expanded/collapsed
  const renderRoute = (route: typeof SidebarRoutes[0], key: string) => {
    const isActive = isRouteActive(route.href, pathname, basePath);
    const targetPath = constructPath(basePath, route.href);

    return isExpanded ? (
      // Expanded view with labels
      <Button
        key={key}
        variant="ghost"
        onClick={() => router.push(targetPath)} 
        className={`w-full justify-start p-0! px-2! h-9 ${
          isActive
            ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
            : 'dark:text-white dark:hover:text-white! text-muted-foreground!'
        }`}
      >
        <route.icon className='dark:hover:fill-black'/>
        <span className='text-md'>{route.label}</span>
      </Button>
    ) : (
      // Collapsed view with tooltips
      <Tooltip key={key}>
        <TooltipTrigger asChild className='w-12 h-12'>
          <Button
            variant="ghost"
            onClick={() => router.push(targetPath)} 
            className={`p-0! w-9 h-9 ${
              isActive
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                : 'dark:text-white dark:hover:text-black!'
            }`}
          >
            <route.icon size={22} className={`${!isActive && "stroke-muted-foreground"} hover:stroke-black`} />
          </Button> 
        </TooltipTrigger>
        <TooltipContent side="right" className='text-md'>
          {route.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  // Build the content with separators if not in database view
  let navContent: React.ReactNode[] = [];
    const groups = [
      SidebarRoutes.slice(0, 2),
      SidebarRoutes.slice(2, 6),
      SidebarRoutes.slice(6, 9),
      SidebarRoutes.slice(9, 12),
    ];
    groups.forEach((group, groupIndex) => {
      group.forEach((route, routeIndex) => {
        navContent.push(renderRoute(route, `${groupIndex}-${route.href || routeIndex}`));
      });
      if (groupIndex < groups.length - 1) {
        navContent.push(
          <div key={`sep-${groupIndex}`} className={`h-px ${isExpanded ? "w-[190px]" : "w-[45px]" } mx-auto bg-border my-2`} />
        );
      }
    });

  // --- Render the sidebar with expand toggle at the bottom ---
  return (
    <TooltipProvider>
      <div 
        className={`bg-gray-50 dark:bg-black/5 dark:text-white hidden mt-[65px] md:flex flex-col justify-between overflow-y-clip text-muted-foreground border-r-2 border-separate transition-all duration-300 sticky top-0 p-0!
        ${isExpanded ? 'w-48' : 'w-[70px]'}`}
      >

        {/* Navigation Links */}
        <div className='bg-gray-50 dark:bg-black/5 dark:text-white relative flex flex-col p-2 gap-1 items-center w-full'>
          {navContent}
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
  ;
  const segments = pathname.split('/').filter(Boolean);
  const basePath = '/' + segments.slice(0, 2).join('/');

  const isRouteActive = (routeHref: string, currentPathname: string, basePath: string) => {
    const targetPath = routeHref === "" ? basePath : `${basePath}${routeHref}`;
    return currentPathname.startsWith(targetPath);
  }

  const constructPath = (basePath: string, routeHref: string) => {
    if (routeHref === "") return basePath;
    return `${basePath}${routeHref.startsWith('/') ? '' : '/'}${routeHref}`;
  }

  // Build the content with separators if not in database view
  let mobileContent: React.ReactNode[] = [];
    SidebarRoutes.forEach((route, index) => {
      const isActive = isRouteActive(route.href, pathname, basePath);
      const targetPath = constructPath(basePath, route.href);
      mobileContent.push(
        <button 
          key={route.href || `route-${index}`}
          onClick={() => {
            router.push(targetPath)
            setIsOpen(false)
          }} 
          className={`flex p-2 rounded-md justify-start gap-2 bg-transparent text-black hover:bg-indigo-200 ${isActive && '!bg-indigo-500 !text-white'}`}
        >
          <route.icon size={20} />
          {route.label}
        </button>
      );
    });
    const groups = [
      SidebarRoutes.slice(0, 2),
      SidebarRoutes.slice(2, 6),
      SidebarRoutes.slice(6, 9),
      SidebarRoutes.slice(9, 12),
    ];
    groups.forEach((group, groupIndex) => {
      group.forEach((route, routeIndex) => {
        const isActive = isRouteActive(route.href, pathname, basePath);
        const targetPath = constructPath(basePath, route.href);
        mobileContent.push(
          <button 
            key={`${groupIndex}-${route.href || routeIndex}`}
            onClick={() => {
              router.push(targetPath)
              setIsOpen(false)
            }} 
            className={`flex p-2 rounded-md justify-start gap-2 bg-transparent text-black hover:bg-indigo-200 ${isActive && '!bg-indigo-500 !text-white'}`}
          >
            <route.icon size={20} />
            {route.label}
          </button>
        );
      });
      if (groupIndex < groups.length - 1) {
        mobileContent.push(
          <div key={`sep-${groupIndex}`} className="h-px w-3xs bg-border my-2" />
        );
      }
    });

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
              {mobileContent}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}