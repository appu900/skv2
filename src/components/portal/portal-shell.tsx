"use client";

import { Fragment, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { NAVIGATION } from "@/config/navigation";
import { ROLE_CONFIG, type PortalSlug } from "@/lib/auth/roles";
import { useSession } from "@/lib/auth/use-session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { PortalTheme, ThemeToggle } from "./theme-toggle";

// Portal > section > page, derived from the navigation config.
function useBreadcrumbs(portal: PortalSlug) {
  const pathname = usePathname();
  const crumbs: { title: string; href?: string }[] = [{ title: ROLE_CONFIG[portal].label, href: `/${portal}` }];
  for (const section of NAVIGATION[portal]) {
    const item = section.items
      .filter((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (item && item.href !== `/${portal}`) {
      if (section.title) crumbs.push({ title: section.title });
      crumbs.push({ title: item.title, href: item.href });
      break;
    }
  }
  if (crumbs.length === 1) crumbs.push({ title: "Dashboard" });
  return crumbs;
}

function PortalBreadcrumbs({ portal }: { portal: PortalSlug }) {
  const crumbs = useBreadcrumbs(portal);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.title}-${index}`}>
              <BreadcrumbItem className={index === 0 ? "hidden md:block" : undefined}>
                {last ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.title}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.title}</span>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : undefined} />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function PortalShell({ portal, children }: { portal: PortalSlug; children: React.ReactNode }) {
  const { data: session } = useSession();
  const notApproved = session?.status && session.status !== "Approved";

  return (
    <SidebarProvider>
      <PortalTheme />
      <AppSidebar portal={portal} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div aria-hidden className="mr-2 h-4 w-px bg-border" />
          {/* breadcrumbs come from the URL, which must be read inside Suspense on dynamic routes */}
          <Suspense fallback={<span className="text-sm text-muted-foreground">{ROLE_CONFIG[portal].label}</span>}>
            <PortalBreadcrumbs portal={portal} />
          </Suspense>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {notApproved && (
            <Alert className="mb-6 border-warning/30 bg-warning/5">
              <TriangleAlert className="text-warning" />
              <AlertTitle>Application {session?.status?.toLowerCase()}</AlertTitle>
              <AlertDescription>
                Your application has not been approved by the awarding body yet. Some actions stay locked until it is.
              </AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
