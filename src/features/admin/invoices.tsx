"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AgencyInvoice, AssessmentAgency } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatCurrency } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { GenerateInvoiceDialog, InvoiceSheet } from "@/components/shared/invoice-parts";
import { Field } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function MarkPaidDialog({ invoice }: { invoice: AgencyInvoice }) {
  const pay = useApiMutation(
    (body: { transactionId: string; amount: number }) => api.put(`/invoice/payment/${invoice._id}`, body),
    "Invoice marked as paid"
  );
  return (
    <FormDialog
      trigger={<Button size="sm">Mark paid</Button>}
      title={`Pay invoice ${invoice.month} ${invoice.year}`}
      description="Every exam on this invoice is marked as paid as well."
      submitLabel="Mark paid"
      onSubmit={(form) =>
        pay.mutateAsync({ transactionId: String(form.get("transactionId")), amount: Number(form.get("amount")) })
      }
    >
      <Field label="Transaction / UTR number" name="transactionId" required />
      <Field label="Amount paid (₹)" name="amount" type="number" min={0} step="0.01" required defaultValue={invoice.totalAmountToBePaid ?? 0} />
    </FormDialog>
  );
}

export function InvoicesPage() {
  const agencies = useList<AssessmentAgency>("/aa/status/approved");
  const [agencyId, setAgencyId] = useState("");
  const invoices = useList<AgencyInvoice>(agencyId ? `/invoice/aa/${agencyId}` : null);

  return (
    <>
      <PageHeader
        title="Agency invoices"
        description="Monthly invoices of assessment agencies and their payment."
        actions={agencyId ? <GenerateInvoiceDialog agencyId={agencyId} /> : undefined}
      />
      <ListCard
        toolbar={
          <Select value={agencyId} onValueChange={setAgencyId}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={agencies.isLoading ? "Loading agencies…" : "Select an assessment agency"} />
            </SelectTrigger>
            <SelectContent>
              {(agencies.data ?? []).map((aa) => (
                <SelectItem key={aa._id} value={aa._id}>
                  {aa.agencyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {!agencyId ? (
          <EmptyState icon={Receipt} title="Select an agency" description="Its invoices are listed here." />
        ) : invoices.isLoading ? (
          <LoadingRows />
        ) : !invoices.data?.length ? (
          <EmptyState icon={Receipt} title="No invoices yet" description="Generate one for a month with completed exams." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="hidden sm:table-cell">Assessed</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.data.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>
                    <p className="font-medium">
                      {invoice.month} {invoice.year}
                    </p>
                    <p className="text-xs text-muted-foreground">{invoice.examDetails?.length ?? 0} exams</p>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{invoice.totalNoOfAssessedCandidates ?? 0}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(invoice.totalAmountToBePaid)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={invoice.paymentStatus ? "success" : "warning"}>{invoice.paymentStatus ? "Paid" : "Unpaid"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <InvoiceSheet invoice={invoice} />
                      {!invoice.paymentStatus && <MarkPaidDialog invoice={invoice} />}
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
