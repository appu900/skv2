"use client";

import { useState } from "react";
import { Upload, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Batch } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatCurrency } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { StatusTabs } from "@/components/shared/status-tabs";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrainingPartner } from "./use-training-partner";

type Tab = "due" | "sna" | "review" | "paid";

function paymentTab(batch: Batch): Tab | null {
  if (!batch.batchActivePermission) return null;
  if (batch.paymentStatus) return "paid";
  if (batch.clientPaymentStatus) return "review";
  if (!batch.approvedByGovernmentBody) return "sna";
  return "due";
}

function UploadProofDialog({ batch }: { batch: Batch }) {
  const upload = useApiMutation((form: FormData) => api.put(`/batch/paymentdetails/${batch._id}`, form), "Payment proof sent for review");
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Upload />
          Upload proof
        </Button>
      }
      title="Upload payment proof"
      description={`${batch.ABN_Number} · ${formatCurrency(batch.amountToPaid)} for ${batch.students?.length ?? 0} candidate(s)`}
      submitLabel="Send for review"
      onSubmit={async (form) => {
        const body = new FormData();
        body.append("transactionId", String(form.get("transactionId")).trim());
        body.append("paymentPublishedBy", String(form.get("paymentPublishedBy")).trim());
        body.append("preInvoice", form.get("preInvoice") as File);
        body.append("postInvoice", form.get("postInvoice") as File);
        await upload.mutateAsync(body);
      }}
    >
      <Field label="Transaction ID / UTR" name="transactionId" required />
      <Field label="Paid by" name="paymentPublishedBy" required placeholder="Name of the payer" />
      <Field label="Pre-payment invoice" name="preInvoice" type="file" accept=".pdf,image/*" required />
      <Field label="Payment receipt" name="postInvoice" type="file" accept=".pdf,image/*" required />
    </FormDialog>
  );
}

const STATUS: Record<Tab, React.ReactNode> = {
  due: <Badge variant="warning">Payment due</Badge>,
  sna: <Badge variant="outline">{"Awaiting approval"}</Badge>,
  review: <Badge variant="info">Under review</Badge>,
  paid: <Badge variant="success">Paid</Badge>,
};

export function PaymentsPage() {
  const { tpId } = useTrainingPartner();
  const [tab, setTab] = useState<Tab>("due");
  const batches = useList<Batch>(tpId ? `/batch/tp/${tpId}` : null);

  const submitted = (batches.data ?? []).filter((batch) => paymentTab(batch) !== null);
  const of = (value: Tab) => submitted.filter((batch) => paymentTab(batch) === value);
  const sum = (rows: Batch[]) => rows.reduce((total, batch) => total + (batch.amountToPaid || 0), 0);
  const rows = of(tab);
  const loading = !tpId || batches.isLoading;

  return (
    <>
      <PageHeader title="Payments" description="Fees of submitted batches. Upload the proof once paid; the awarding body confirms it." />
      <StatGrid>
        <StatCard label="Due" value={formatCurrency(sum(of("due")))} hint={`${of("due").length} batch(es)`} icon={Wallet} tone="warning" loading={loading} />
        <StatCard label="Under review" value={formatCurrency(sum(of("review")))} hint={`${of("review").length} batch(es)`} icon={Wallet} tone="info" loading={loading} />
        <StatCard label="Paid" value={formatCurrency(sum(of("paid")))} hint={`${of("paid").length} batch(es)`} icon={Wallet} tone="success" loading={loading} />
        <StatCard label="Awaiting approval" value={of("sna").length} hint="Payable after approval" icon={Wallet} loading={loading} />
      </StatGrid>
      <div className="mt-6">
        <ListCard
          toolbar={
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "due", label: "Due", count: of("due").length },
                { value: "review", label: "Under review", count: of("review").length },
                { value: "paid", label: "Paid", count: of("paid").length },
                { value: "sna", label: "Awaiting approval", count: of("sna").length },
              ]}
            />
          }
        >
          {loading ? (
            <LoadingRows />
          ) : rows.length === 0 ? (
            <EmptyState icon={Wallet} title="Nothing here" description="Batches appear here after you submit them." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead className="hidden md:table-cell">Scheme</TableHead>
                  <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">Proof</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((batch) => (
                  <TableRow key={batch._id}>
                    <TableCell>
                      <p className="font-medium">{batch.ABN_Number}</p>
                      <p className="text-xs text-muted-foreground">{batch.courseName}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p>{batch.scheme}</p>
                      <p className="text-xs text-muted-foreground">{batch.schemeType}</p>
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{batch.students?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium tabular-nums">{batch.amountToPaid ? formatCurrency(batch.amountToPaid) : "Not set"}</p>
                      {batch.perStudentCost ? (
                        <p className="text-xs text-muted-foreground">{formatCurrency(batch.perStudentCost)} / candidate</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {batch.transactionId ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs">{batch.transactionId}</span>
                          <FileLink href={batch.postPaymentInvoice} label="Receipt" />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {tab === "due" ? (
                        batch.amountToPaid ? (
                          <UploadProofDialog batch={batch} />
                        ) : (
                          <Badge variant="outline">Waiting for the fee</Badge>
                        )
                      ) : (
                        STATUS[tab]
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ListCard>
      </div>
    </>
  );
}
