import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { buttonVariants } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/grants": "Grants",
  "/grants/new": "Add a grant",
  "/valuations": "Valuations",
  "/potential": "Stock Potential",
  "/settings": "Settings",
}

export function AppLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = PAGE_TITLES[pathname]
    document.title = page ? `${page}: VestWise` : "VestWise"
  }, [pathname])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <a
          href="#content"
          className={cn(
            buttonVariants(),
            "sr-only fixed top-3 left-3 z-50 focus:not-sr-only"
          )}
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset className="relative">
          <div className="px-3 pt-3 lg:absolute lg:top-3 lg:left-3 lg:z-10 lg:p-0">
            <Tooltip>
              <TooltipTrigger render={<SidebarTrigger />} />
              <TooltipContent side="right">
                Toggle sidebar <kbd data-slot="kbd">⌘B</kbd>
              </TooltipContent>
            </Tooltip>
          </div>
          <div
            id="content"
            className="mx-auto w-full max-w-[1320px] px-5 pt-5 pb-[calc(var(--line)*2)] sm:px-8 lg:px-12 lg:pt-[calc(var(--line)*1.25)]"
          >
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
