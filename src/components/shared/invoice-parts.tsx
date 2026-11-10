"use client";

import { FilePlus2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AgencyInvoice } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { MONTHS } from "@/lib/domain/states";
import { formatCurrency } from "@/lib/domain/stages";
import { DetailList } from "@/components/shared/detail-list";
import { Field, SelectField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Used by the admin and by the assessment agency itself.
export function GenerateInvoiceDialog({ agencyId }: { agencyId: string }) {
  const generate = useApiMutation(
    (body: { month: string; year: string }) => api.post(`/invoice/${agencyId}`, body),
    "Invoice generated"
  );
  const now = new Date();
  return (
    <FormDialog
      trigger={
        <Button variant="outline">
          <FilePlus2 />
          Generate invoice
        </Button>
      }
      title="Generate monthly invoice"
      description="Adds up every completed exam of the month. Regenerating refreshes an unpaid invoice."
      submitLabel="Generate"
      onSubmit={(form) => generate.mutateAsync({ month: String(form.get("month")), year: String(form.get("year")) })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Month" name="month" required options={MONTHS} defaultValue={MONTHS[now.getMonth()]} />
        <Field label="Year" name="year" type="number" min={2020} max={2100} required defaultValue={now.getFullYear()} />
      </div>
    </FormDialog>
  );
}

export function InvoiceSheet({ invoice }: { invoice: AgencyInvoice }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Invoice {invoice.month} {invoice.year}
          </SheetTitle>
          <SheetDescription>Generated {invoice.invoiceGenerateDate}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <DetailList
            items={[
              ["Candidates", invoice.totalNoOfcandidates],
              ["Assessed", invoice.totalNoOfAssessedCandidates],
              ["Agency share", `${invoice.Paymentpercentage ?? 0}%`],
              ["Amount due", formatCurrency(invoice.totalAmountToBePaid)],
              ["Paid", invoice.paymentStatus ? formatCurrency(invoice.paidAmount) : "No"],
              ["Transaction", invoice.transactionId],
            ]}
          />
          <FileLink href={invoice.invoicePdf} label="Signed invoice PDF" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden sm:table-cell">Training partner</TableHead>
                <TableHead className="hidden sm:table-cell">Assessed</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.examDetails ?? []).map((row) => (
                <TableRow key={row.examId}>
                  <TableCell>
                    <p className="font-medium">{row.batchAbn}</p>
                    <p className="text-xs text-muted-foreground">{row.assesmentDate}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{row.tpname}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {row.noOfAssessedCandidates ?? "—"} / {row.totalNoOfCandidates ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(row.amountToPaid)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
