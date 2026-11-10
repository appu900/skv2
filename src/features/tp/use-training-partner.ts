"use client";

import type { TrainingPartner } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { useSession } from "@/lib/auth/use-session";

// The logged in training partner: its id (from the session) and its record.
export function useTrainingPartner() {
  const { data: session } = useSession();
  const tpId = session?.id ?? null;
  const profile = useItem<TrainingPartner>(tpId ? `/tp/${tpId}` : null);
  return {
    tpId,
    profile,
    approved: profile.data?.applicationStatus === "Approved",
  };
}
