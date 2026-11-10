import { PortalShell } from "@/components/portal/portal-shell";

export default function Layout({ children }: LayoutProps<"/admin">) {
  return <PortalShell portal="admin">{children}</PortalShell>;
}
