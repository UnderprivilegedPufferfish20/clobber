"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const routes = [
  "Users",
  "Sign In",
  "Policies",
  "Sessions",
  "MFA",
  "URL Config",
]

export default function AuthNavbar() {
  const isMobile = useIsMobile()

  const router = useRouter()
  const pathname = usePathname()

  const setPageRoute = (val: string) => {
    // "Schema Editor" always routes to "/"
    if (val === "users") {
      router.push(`${pathname.split("/").slice(0,4).join("/")}`)
      return
    }
    const route = val.toLowerCase().replace(" ", "_")
    router.push(`${pathname.split("/").slice(0,4).join("/")}/${route}`)
  }

  const isActive = (val: string) => {
    const route = val.toLowerCase().replace(" ", "_")
    // "Schema Editor" is active when pathname is exactly "/"
    if (route === "users") {
      return pathname === pathname.split("/").slice(0,4).join("/")
    }
    return pathname.endsWith(`/${route}`)
  }

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList>
        {routes.map(r => {
          const routeVal = r.toLowerCase().replace(" ", "_")

          return (
            <NavigationMenuItem key={r}>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Button
                  variant={"ghost"}
                  onClick={() => setPageRoute(routeVal)}
                  className={`
                    cursor-pointer hover:bg-gray-400
                    ${
                      isActive(r)
                        ? 'bg-indigo-500! focus:bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                        : 'text-black dark:text-white'
                    }
                  `}
                >
                  {r}
                </Button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
