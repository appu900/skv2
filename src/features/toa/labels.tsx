import { Badge } from "@/components/ui/badge";
import type { BatchStatus, SessionStatus, TraineeStatus } from "@/lib/api/toa";

type Variant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info";

const TRAINEE: Record<TraineeStatus, [string, Variant]> = {
  draft: ["Draft", "outline"],
  submitted: ["Submitted", "info"],
  under_review: ["Under review", "info"],
  correction_required: ["Correction required", "warning"],
  approved: ["Approved", "success"],
  rejected: ["Rejected", "destructive"],
};
const BATCH: Record<BatchStatus, [string, Variant]> = {
  draft: ["Draft", "outline"],
  submitted: ["Submitted", "info"],
  under_review: ["Under review", "info"],
  returned: ["Returned for correction", "warning"],
  approved: ["Approved", "success"],
  rejected: ["Rejected", "destructive"],
  completed: ["Completed", "secondary"],
};
const SESSION: Record<SessionStatus, [string, Variant]> = {
  not_marked: ["Not marked", "outline"],
  draft: ["Marked (not submitted)", "warning"],
  submitted: ["Waiting for CUTM", "info"],
  approved: ["Approved", "success"],
  returned: ["Returned", "warning"],
};

export const TRAINEE_LABEL = Object.fromEntries(Object.entries(TRAINEE).map(([key, [label]]) => [key, label])) as Record<TraineeStatus, string>;

export const TraineeStatusBadge = ({ status }: { status: TraineeStatus }) => <Badge variant={TRAINEE[status][1]}>{TRAINEE[status][0]}</Badge>;
export const BatchStatusBadge = ({ status }: { status: BatchStatus }) => <Badge variant={BATCH[status][1]}>{BATCH[status][0]}</Badge>;
export const SessionStatusBadge = ({ status }: { status: SessionStatus }) => <Badge variant={SESSION[status][1]}>{SESSION[status][0]}</Badge>;

const PAYMENT: Record<string, Variant> = { unpaid: "warning", paid: "success", cancelled: "outline", refunded: "secondary", successful: "success", failed: "destructive", created: "outline", pending: "info", duplicate: "warning" };
export const MoneyStatusBadge = ({ status }: { status: string }) => <Badge variant={PAYMENT[status] ?? "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;

const CERT: Record<string, Variant> = { valid: "success", revoked: "destructive", reissued: "secondary" };
export const CertificateStatusBadge = ({ status }: { status: string }) => <Badge variant={CERT[status] ?? "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;

export const tpName = (value: unknown) => (value && typeof value === "object" && "organizationName" in value ? String((value as { organizationName: string }).organizationName) : "—");

export function History({ entries }: { entries: { status: string; remarks?: string; reference?: string; byRole?: string; at: string }[] }) {
  return (
    <ol className="flex flex-col gap-2 border-l pl-4">
      {[...entries].reverse().map((entry, index) => (
        <li key={index} className="relative text-sm">
          <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" />
          <p className="font-medium capitalize">
            {entry.status.replaceAll("_", " ")}
            <span className="font-normal text-muted-foreground"> · {entry.byRole === "Admin" ? "CUTM" : "Training partner"}</span>
          </p>
          {entry.reference && <p className="text-xs text-muted-foreground">Ref. {entry.reference}</p>}
          {entry.remarks && <p className="text-muted-foreground">“{entry.remarks}”</p>}
          <p className="text-xs text-muted-foreground">{new Date(entry.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
        </li>
      ))}
    </ol>
  );
}
