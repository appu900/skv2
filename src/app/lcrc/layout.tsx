import { PortalShell } from "@/components/portal/portal-shell";

export default function Layout({ children }: LayoutProps<"/lcrc">) {
  return <PortalShell portal="lcrc">{children}</PortalShell>;
}
