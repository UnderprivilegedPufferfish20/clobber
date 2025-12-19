"use client"

import * as React from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const routes = [
  "Table Editor",
  "SQL Editor",
  "Functions",
  "Triggers",
  "Enums",
  "Indexes",
  "Extensions",
  "Backups",
  "Replication",
  "Settings"
]

export function DatabaseNavbar() {
  const isMobile = useIsMobile()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setPageParam = (val: string) => {
    router.replace(pathname, { scroll: false })
    router.push(`${pathname}?page=${val}`)
  }

  const isActive = (val: string) => {
    const queryVal = searchParams.get("page");

    if (!queryVal && val == "table_editor") {
      return true
    } else if (!queryVal) {
      return false
    }

    return queryVal == val
  }

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList>
        {routes.map(r => {

          const queryVal = r.toLowerCase().replace(" ", "_")

          return (
            <NavigationMenuItem key={r}>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <p
                  onClick={() => setPageParam(queryVal)}
                  className={`
                    cursor-pointer hover:bg-gray-400
                    ${
                      isActive(queryVal)
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                        : 'text-black hover:bg-indigo-200! dark:text-white dark:hover:text-black!'
                    }
                  `}
                >
                  {r}
                </p>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
