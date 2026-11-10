"use client";

import type { AssessmentAgency } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { useSession } from "@/lib/auth/use-session";

// The logged in assessment agency: its id (from the session) and its record.
export function useAgency() {
  const { data: session } = useSession();
  const aaId = session?.id ?? null;
  const profile = useItem<AssessmentAgency>(aaId ? `/aa/${aaId}` : null);
  return { aaId, profile, approved: profile.data?.applicationStatus === "Approved" };
}
