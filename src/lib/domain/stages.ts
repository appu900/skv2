// Turns the backend's status flags into one readable stage per record.

export type Tone = "default" | "success" | "warning" | "muted" | "info";

export interface Stage {
  label: string;
  tone: Tone;
}

export interface BatchFlags {
  schemeType?: string;
  batchActivePermission?: boolean;
  approvedByGovernmentBody?: boolean;
  rejectedByGovernmentBody?: boolean;
  clientPaymentStatus?: boolean;
  paymentStatus?: boolean;
  isAssigned?: boolean;
  certificateIssued?: boolean;
}

// Who approves centres and batches of a scheme type: the SNA for government, the LC/RC for corporate.
export const approverOf = (schemeType?: string) => (schemeType === "Corporate" ? "LC/RC" : "SNA");

export function batchStage(batch: BatchFlags): Stage {
  if (batch.certificateIssued) return { label: "Completed", tone: "success" };
  if (batch.isAssigned) return { label: "In assessment", tone: "info" };
  if (batch.paymentStatus) return { label: "Awaiting assessment", tone: "info" };
  if (!batch.batchActivePermission) {
    return batch.rejectedByGovernmentBody ? { label: "Returned for changes", tone: "warning" } : { label: "Draft", tone: "muted" };
  }
  // government batches are approved by the SNA, corporate ones by the LC/RC
  if (!batch.approvedByGovernmentBody) return { label: "Awaiting approval", tone: "warning" };
  if (!batch.clientPaymentStatus) return { label: "Payment due", tone: "warning" };
  return { label: "Payment under review", tone: "warning" };
}

export interface ExamFlags {
  AssessorId?: unknown;
  assesmentdate?: string;
  markUploadAndExamCompleteStatus?: boolean;
  certificateIssued?: boolean;
  certificateStatus?: string;
}

export function examStage(exam: ExamFlags): Stage {
  if (exam.certificateIssued) return { label: "Certified", tone: "success" };
  if (exam.certificateStatus === "queued" || exam.certificateStatus === "processing") {
    return { label: "Generating certificates", tone: "info" };
  }
  if (exam.markUploadAndExamCompleteStatus) return { label: "Results submitted", tone: "info" };
  if (!exam.AssessorId) return { label: "Assign assessor", tone: "warning" };
  if (!exam.assesmentdate) return { label: "Schedule date", tone: "warning" };
  return { label: "Assessment pending", tone: "default" };
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatCurrency(value?: number | null): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    value || 0
  );
}
