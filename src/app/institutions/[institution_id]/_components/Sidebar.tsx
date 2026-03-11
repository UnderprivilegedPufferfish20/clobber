"use client";

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeftToLine, ArrowRightFromLine, BoxesIcon, CircleDollarSignIcon, Settings2Icon, UsersIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react'

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false)

  const routes = [
    {
      href: "",
      label: "Projects",
      icon: BoxesIcon,
    },
    {
      href: "/team",
      label: "Team",
      icon: UsersIcon,
    },


    {
      href: "/billing",
      label: "Billing",
      icon: CircleDollarSignIcon,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings2Icon,
    },
  ]

  const segments = pathname.split('/').filter(Boolean);
  const basePath = '/' + segments.slice(0, 2).join('/'); 
  
  
    
  const isRouteActive = (routeHref: string, currentPathname: string) => {
    if (routeHref === "") {
      return true
    } else {
      return currentPathname.includes(routeHref) && routeHref.split("/").length > 1;
    };
  }

  const constructPath = (basePath: string, routeHref: string) => {
    if (routeHref === "") return basePath;
    return `${basePath}${routeHref.startsWith('/') ? '' : '/'}${routeHref}`;
  }

  // Render function for a single route, handling expanded/collapsed
  const renderRoute = (route: typeof routes[0], key: any) => {
    const isActive = isRouteActive(route.href, pathname);
    const targetPath = constructPath(basePath, route.href);

    return isExpanded ? (
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

  return (
    <TooltipProvider>
      <div 
        className={`bg-secondary dark:text-white hidden mt-16.25 md:flex flex-col justify-between overflow-hidden overflow-x-hidden text-muted-foreground border-r-2 border-separate transition-all duration-300
        ${isExpanded ? 'w-48' : 'w-17.5'}`}
      >

        {/* Navigation Links */}
        <div className='bg-gray-50 dark:bg-black/5 dark:text-white relative flex flex-col p-2 gap-1 items-center w-full'>
          {routes.map((r, idx) => (
            renderRoute(r, idx)
          ))}
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

export default Sidebar