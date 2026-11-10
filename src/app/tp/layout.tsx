import { PortalShell } from "@/components/portal/portal-shell";

export default function Layout({ children }: LayoutProps<"/tp">) {
  return <PortalShell portal="tp">{children}</PortalShell>;
}
