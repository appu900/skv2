import { PortalShell } from "@/components/portal/portal-shell";
import { ToaPasswordGate } from "@/features/toa/password-gate";

export default function Layout({ children }: LayoutProps<"/toa">) {
  return (
    <PortalShell portal="toa">
      <ToaPasswordGate>{children}</ToaPasswordGate>
    </PortalShell>
  );
}
