import { PortalShell } from "@/components/portal/portal-shell";
import { ToaPasswordGate } from "@/features/toa/password-gate";

export default function Layout({ children }: LayoutProps<"/toa-admin">) {
  return (
    <PortalShell portal="toa-admin">
      <ToaPasswordGate portal="toa-admin">{children}</ToaPasswordGate>
    </PortalShell>
  );
}
