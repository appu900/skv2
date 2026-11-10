import { PortalShell } from "@/components/portal/portal-shell";

export default function Layout({ children }: LayoutProps<"/aa">) {
  return <PortalShell portal="aa">{children}</PortalShell>;
}
