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
    const queryVal = searchParams.get("page");

    if (!queryVal && val == "functions") {
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
                <Button
                  onClick={() => setPageParam(queryVal.toLowerCase())}
                  className={`
                    cursor-pointer
                    ${
                      isActive(queryVal)
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
