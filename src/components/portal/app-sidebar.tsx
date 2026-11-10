"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChevronsUpDown, GraduationCap, LogOut } from "lucide-react";
import { NAVIGATION } from "@/config/navigation";
import { ROLE_CONFIG, type PortalSlug } from "@/lib/auth/roles";
import { useSession } from "@/lib/auth/use-session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function UserMenu({ portal }: { portal: PortalSlug }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isMobile } = useSidebar();
  const name = session?.name || ROLE_CONFIG[portal].label;

  const logout = async () => {
    await axios.post("/api/auth/logout");
    queryClient.clear();
    router.replace(`/login/${portal}`);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {initials(session?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{session?.email || ROLE_CONFIG[portal].label}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
          >
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{name}</p>
              {session?.email && <p className="truncate text-xs text-muted-foreground">{session.email}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{ROLE_CONFIG[portal].label}</Badge>
                {session?.status && <Badge variant={session.status === "Approved" ? "success" : "warning"}>{session.status}</Badge>}
                {session?.state && <Badge variant="outline">{session.state}</Badge>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} variant="destructive">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavSections({ portal, pathname }: { portal: PortalSlug; pathname: string }) {
  const { setOpenMobile } = useSidebar();
  return NAVIGATION[portal].map((section, index) => (
    <SidebarGroup key={section.title ?? index}>
      {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => {
            const active = item.href === `/${portal}` ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

function ActiveNavSections({ portal }: { portal: PortalSlug }) {
  return <NavSections portal={portal} pathname={usePathname()} />;
}

export function AppSidebar({ portal }: { portal: PortalSlug }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${portal}`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">CUTM Awarding Body</span>
                  <span className="truncate text-xs text-muted-foreground">{ROLE_CONFIG[portal].label} portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* the active link comes from the URL, which must be read inside Suspense on dynamic routes */}
        <Suspense fallback={<NavSections portal={portal} pathname="" />}>
          <ActiveNavSections portal={portal} />
        </Suspense>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu portal={portal} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
