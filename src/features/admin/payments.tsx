"use client";

import { useState } from "react";
import { CircleCheck, Coins, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Batch } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { approverOf, formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BatchSheet } from "@/components/shared/batch-sheet";

type Tab = "confirm" | "corporate" | "confirmed";

function BatchCell({ batch }: { batch: Batch }) {
  return (
    <>
      <p className="font-medium">{batch.ABN_Number || batch.courseName}</p>
      <p className="text-xs text-muted-foreground">
        {batch.trainingOrganization} · {batch.students.length} candidates
      </p>
    </>
  );
}

function ConfirmPaymentButton({ batch }: { batch: Batch }) {
  const confirm = useApiMutation(() => api.put(`/batch/paymentstatus/${batch._id}`), "Payment confirmed");
  const waitingForSna = !batch.approvedByGovernmentBody;

  if (waitingForSna) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button size="sm" disabled>
              Confirm
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Waiting for {approverOf(batch.schemeType)} approval of this batch</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <ConfirmDialog
      trigger={<Button size="sm">Confirm</Button>}
      title="Confirm this payment?"
      description={`${formatCurrency(batch.amountToPaid)} from ${batch.trainingOrganization}, transaction ${batch.transactionId || "—"}. The batch can then be assigned to an assessment agency.`}
      confirmLabel="Confirm payment"
      onConfirm={() => confirm.mutateAsync(undefined)}
    />
  );
}

function SetFeeDialog({ batch }: { batch: Batch }) {
  const setFee = useApiMutation(
    (amount: number) => api.put(`/batch/addpayment/${batch._id}`, { amount }),
    "Batch amount updated"
  );
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          Set amount
        </Button>
      }
      title="Set payable amount"
      description={`${batch.ABN_Number} · ${batch.students.length} candidates. Currently ${formatCurrency(batch.amountToPaid)} (fee × candidates + 18% GST).`}
      submitLabel="Save amount"
      onSubmit={(form) => setFee.mutateAsync(Number(form.get("amount")))}
    >
      <Field label="Total amount (₹)" name="amount" type="number" min={1} step="0.01" required defaultValue={batch.amountToPaid || ""} />
    </FormDialog>
  );
}

export function PaymentsPage() {
  const [tab, setTab] = useState<Tab>("confirm");
  const [search, setSearch] = useState("");
  const toConfirm = useList<Batch>("/batch/all/paymentnotification");
  const corporate = useList<Batch>("/batch/all/corporate");
  const all = useList<Batch>("/batch");
  const confirmed = (all.data ?? []).filter((batch) => batch.paymentStatus);

  const source = { confirm: toConfirm, corporate, confirmed: { data: confirmed, isLoading: all.isLoading } }[tab];
  const rows = (source.data ?? []).filter((batch) =>
    matches(search, batch.ABN_Number, batch.trainingOrganization, batch.transactionId, batch.courseName)
  );

  return (
    <>
      <PageHeader title="Payments" description="Confirm batch payments and set corporate amounts." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "confirm", label: "To confirm", count: toConfirm.data?.length },
                { value: "corporate", label: "Corporate amounts", count: corporate.data?.length },
                { value: "confirmed", label: "Confirmed", count: confirmed.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, partner, transaction…" />
            </div>
          </>
        }
      >
        {source.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={tab === "confirmed" ? CircleCheck : tab === "corporate" ? Coins : Wallet}
            title={tab === "confirm" ? "Nothing to confirm" : tab === "corporate" ? "No corporate batches waiting" : "No confirmed payments yet"}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Scheme</TableHead>
                <TableHead className="hidden lg:table-cell">{tab === "corporate" ? "Submitted" : "Proof"}</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <BatchCell batch={batch} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{batch.schemeType}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {batch.approvedByGovernmentBody ? `${approverOf(batch.schemeType)} approved` : `Waiting for ${approverOf(batch.schemeType)}`}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {tab === "corporate" ? (
                      <span className="text-muted-foreground">{formatDate(batch.createdAt)}</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Txn {batch.transactionId || "—"}</span>
                        <div className="flex gap-3">
                          <FileLink href={batch.prePaymentInvoice} label="Pre" />
                          <FileLink href={batch.postPaymentInvoice} label="Post" />
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(batch.amountToPaid)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <BatchSheet batch={batch} />
                      {tab === "confirm" && <ConfirmPaymentButton batch={batch} />}
                      {tab === "corporate" && <SetFeeDialog batch={batch} />}
                      {tab === "confirmed" && <Badge variant="success">Paid</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
