import type { ApplicationStatus } from "@/lib/api/models";
import { Badge } from "@/components/ui/badge";

const VARIANT = { Pending: "warning", Approved: "success", Rejected: "destructive" } as const;

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={VARIANT[status] ?? "secondary"}>{status}</Badge>;
}
