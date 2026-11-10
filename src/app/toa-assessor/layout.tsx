import { PortalShell } from "@/components/portal/portal-shell";

export default function Layout({ children }: LayoutProps<"/toa-assessor">) {
  return <PortalShell portal="toa-assessor">{children}</PortalShell>;
}
