'use client'

import { CoinsIcon, HomeIcon, Layers2Icon, MenuIcon, ShieldCheckIcon } from 'lucide-react'
import React, { useState } from 'react'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const routes = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/workflows",
    label: "Workflows",
    icon: Layers2Icon,
  },
  {
    href: "/credentials",
    label: "Credentials",
    icon: ShieldCheckIcon,
  },
  {
    href: "/billing",
    label: "Billing",
    icon: CoinsIcon,
  },
]

// Helper function to determine if a route is active
const isRouteActive = (routeHref: string, pathname: string) => {
  // Handle root route specifically
  if (routeHref === '/') {
    return pathname === '/'
  }
  
  // For other routes, check if pathname starts with the route href
  return pathname.startsWith(routeHref)
}

const Sidebar = () => {
  const pathname = usePathname()
  const activeRoute = routes.find((r) => isRouteActive(r.href, pathname)) || routes[0]

  return (
    <div className='hidden relative md:block min-w-[280px] max-w-[280px] h-screen overflow-hidden w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2 border-separate'>
      <div className="flex items-center justify-center gap-2 border-b-[1px] border-separate p-4">
        <Logo />
      </div>
      <div className='flex flex-col p-2'>
        {routes.map((route) => (
          <Link 
            key={route.href} 
            href={route.href}
            className={buttonVariants({
              variant: isRouteActive(route.href, pathname)
                ? 'sidebarActiveItem' : 'sidebarItem'
            })}
          >
            <route.icon size={20} />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Sidebar;

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const pathname = usePathname()
  const activeRoute = routes.find((r) => isRouteActive(r.href, pathname)) || routes[0]

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
                {routes.map((route) => (
                  <Link 
                    key={route.href} 
                    href={route.href}
                    className={buttonVariants({
                      variant: isRouteActive(route.href, pathname)
                        ? 'sidebarActiveItem' : 'sidebarItem'
                    })}
                    onClick={() => setIsOpen(p => !p)}
                  >
                    <route.icon size={20} />
                    {route.label}
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}