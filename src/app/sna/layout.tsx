import { PortalShell } from "@/components/portal/portal-shell";

export default function Layout({ children }: LayoutProps<"/sna">) {
  return <PortalShell portal="sna">{children}</PortalShell>;
}
