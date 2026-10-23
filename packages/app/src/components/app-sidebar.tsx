import { NavLink, useLocation } from "react-router-dom"
import {
  FileTextIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TrendingUpIcon,
} from "lucide-react"
import { Wordmark, WordmarkBar } from "@vestwise/brand"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon, end: true },
  { to: "/grants", label: "Grants", icon: FileTextIcon },
  { to: "/companies", label: "Companies", icon: LandmarkIcon },
  { to: "/potential", label: "Stock Potential", icon: TrendingUpIcon },
]

function isCurrent(pathname: string, to: string, end?: boolean) {
  return end
    ? pathname === to
    : pathname === to || pathname.startsWith(`${to}/`)
}

// Paper with a 1px ink edge; the current page carries the yellow bar
export function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const close = () => setOpenMobile(false)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-ink px-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <NavLink
          to="/"
          onClick={close}
          aria-label="VestWise, dashboard"
          className="inline-flex w-fit items-center"
        >
          <Wordmark className="text-[1.25rem] group-data-[collapsible=icon]:hidden" />
          <WordmarkBar className="hidden h-5 w-2 group-data-[collapsible=icon]:inline-block" />
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  isActive={isCurrent(pathname, item.to, item.end)}
                  tooltip={item.label}
                  render={<NavLink to={item.to} onClick={close} />}
                >
                  <item.icon strokeWidth={2} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isCurrent(pathname, "/settings")}
              tooltip="Settings"
              render={<NavLink to="/settings" onClick={close} />}
            >
              <SettingsIcon strokeWidth={2} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
