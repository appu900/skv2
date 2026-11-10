"use client";

import { Send, Undo2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Exam } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";

const running = (exam: Exam) => exam.certificateStatus === "queued" || exam.certificateStatus === "processing";

// Approving a submitted result generates the certificates (admin for every batch, LC/RC for corporate ones).
export function ApproveResult({ exam }: { exam: Exam }) {
  const approve = useApiMutation(() => api.put(`/lcrc/result/approve/${exam._id}`), "Result approved, certificates are being generated");
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" disabled={running(exam)}>
          <Send />
          {exam.certificateStatus === "failed" ? "Retry" : "Approve & publish"}
        </Button>
      }
      title={`Approve the result of ${exam.batchABN}?`}
      description="Certificates are generated in the background for every present candidate who passed. The training partner and candidates can then download them."
      confirmLabel="Approve & publish"
      onConfirm={() => approve.mutateAsync(undefined)}
    />
  );
}

// Sends the result back to the assessment agency, which uploads corrected sheets.
export function RejectResult({ exam }: { exam: Exam }) {
  const reject = useApiMutation((reason: string) => api.put(`/lcrc/result/reject/${exam._id}`, { reason }), "Result sent back to the agency");
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={running(exam)}>
          <Undo2 />
          Send back
        </Button>
      }
      title={`Send the result of ${exam.batchABN} back?`}
      description={`${exam.assesmentAgency ?? "The assessment agency"} sees your reason and uploads the attendance and result sheets again.`}
      submitLabel="Send back"
      onSubmit={(form) => reject.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} placeholder="e.g. Marks of two candidates do not match the result sheet" />
    </FormDialog>
  );
}
