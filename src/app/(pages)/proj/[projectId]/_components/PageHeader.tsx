'use client'

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sanitizeUrlComponent } from "@/lib/utils";
import { ArrowBigLeftIcon } from "lucide-react";


export default function PageHeader({ content }: { content: { title: string, desc: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function setTab(tabValue: string) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabValue);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <TooltipProvider>
      <div className="h-full w-full bg-white">
        <NavigationMenu viewport={false} className="sticky top-4 left-4">
          <NavigationMenuList>
            {content.map(o => (
              <Tooltip>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} ${searchParams.get('tab') === sanitizeUrlComponent(o.title) ? 'bg-accent' : ''}`}>
                    <TooltipTrigger asChild>
                      <button onClick={() => setTab(sanitizeUrlComponent(o.title))}>{o.title}</button>
                    </TooltipTrigger>
                  </NavigationMenuLink>
                  <TooltipContent>
                    <p>{o.desc}</p>
                  </TooltipContent>
                </NavigationMenuItem>
              </Tooltip>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </TooltipProvider>
  )
}