import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthSplit } from "@/components/auth/auth-split";
import { ApplicationStatusCard } from "@/components/auth/application-status";

export const metadata: Metadata = { title: "Application status" };

// Shown instead of the portal to a training partner whose application the admin has not approved.
export default function Page() {
  return (
    <AuthSplit eyebrow="Training partner" title="Your application" subtitle="Training partners can sign in once the awarding body approves their application.">
      {/* useSearchParams (status) must sit inside Suspense */}
      <Suspense>
        <ApplicationStatusCard />
      </Suspense>
    </AuthSplit>
  );
}
