"use client"


import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import path from "path"

const routes = [
  "Functions",
  "Variables"
]

export function EdgeFunctionsNavbar() {
  const isMobile = useIsMobile()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setPageParam = (val: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', val)
    router.push(`${pathname}?${params}`)
  }

  const isActive = (val: string) => {
    if (pathname.split("/").at(-1) === val) {
      return true
    }

    return false
  }

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList>
        {routes.map(r => {

          return (
            <NavigationMenuItem key={r}>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Button
                  onClick={() => {
                    const segments = pathname.split("/").filter(Boolean);

                    segments.at(-1) === "functions"
                      ? router.push(`/${segments.join("/")}/${r.toLowerCase()}`)
                      : router.push(`${pathname.replaceAll("variables", "")}`);
                    
                  }}
                  className={`
                    cursor-pointer
                    ${
                      isActive(r.toLowerCase())
                        ? 'bg-indigo-500! text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600'
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

export default EdgeFunctionsNavbar;
