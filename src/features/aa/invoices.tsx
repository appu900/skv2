"use client";

import { useRef } from "react";
import Link from "next/link";
import { FileUp, Landmark, Loader2, Receipt, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AgencyInvoice } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatCurrency } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { GenerateInvoiceDialog, InvoiceSheet } from "@/components/shared/invoice-parts";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgency } from "./use-agency";

function UploadSignedPdf({ invoice }: { invoice: AgencyInvoice }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((file: File) => {
    const body = new FormData();
    body.append("pdf", file);
    return api.put(`/invoice/upload/${invoice._id}`, body);
  }, "Signed invoice uploaded");
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = "";
        }}
      />
      <Button variant="ghost" size="sm" disabled={upload.isPending} onClick={() => input.current?.click()}>
        {upload.isPending ? <Loader2 className="animate-spin" /> : <FileUp />}
        {invoice.invoicePdf ? "Replace PDF" : "Upload signed PDF"}
      </Button>
    </>
  );
}

export function AgencyInvoicesPage() {
  const { aaId, profile } = useAgency();
  const invoices = useList<AgencyInvoice>(aaId ? `/invoice/aa/${aaId}` : null);
  const list = invoices.data ?? [];
  const hasBank = Boolean(profile.data?.AccountNumber);
  const unpaid = list.filter((invoice) => !invoice.paymentStatus);
  const sum = (rows: AgencyInvoice[], key: "totalAmountToBePaid" | "paidAmount") => rows.reduce((total, invoice) => total + (invoice[key] || 0), 0);
  const loading = !aaId || invoices.isLoading;

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`Monthly invoices for completed exams. Your share is ${profile.data?.paymentPercentage ?? "—"}% of each candidate's fee.`}
        actions={aaId && hasBank ? <GenerateInvoiceDialog agencyId={aaId} /> : undefined}
      />

      {profile.data && !hasBank && (
        <Alert className="mb-6 border-warning/30 bg-warning/5">
          <Landmark className="text-warning" />
          <AlertTitle>Add your bank details first</AlertTitle>
          <AlertDescription>
            Invoices need the account the awarding body pays into.{" "}
            <Link href="/aa/bank-details" className="font-medium text-primary hover:underline">
              Add bank details
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <StatGrid>
        <StatCard label="Unpaid" value={formatCurrency(sum(unpaid, "totalAmountToBePaid"))} hint={`${unpaid.length} invoice(s)`} icon={Wallet} tone="warning" loading={loading} />
        <StatCard label="Paid" value={formatCurrency(sum(list.filter((invoice) => invoice.paymentStatus), "paidAmount"))} hint="Received so far" icon={Wallet} tone="success" loading={loading} />
        <StatCard label="Candidates assessed" value={list.reduce((total, invoice) => total + (invoice.totalNoOfAssessedCandidates || 0), 0)} hint="Across all invoices" icon={Receipt} tone="info" loading={loading} />
        <StatCard label="Invoices" value={list.length} hint="Generated" icon={Receipt} loading={loading} />
      </StatGrid>

      <div className="mt-6">
        <ListCard>
          {loading ? (
            <LoadingRows />
          ) : list.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Generate one for a month in which you completed exams." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="hidden sm:table-cell">Assessed</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell>
                      <p className="font-medium">
                        {invoice.month} {invoice.year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.examDetails?.length ?? 0} exam(s) · generated {invoice.invoiceGenerateDate}
                      </p>
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{invoice.totalNoOfAssessedCandidates ?? 0}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(invoice.totalAmountToBePaid)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={invoice.paymentStatus ? "success" : "warning"}>{invoice.paymentStatus ? "Paid" : "Unpaid"}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <InvoiceSheet invoice={invoice} />
                      {!invoice.paymentStatus && <UploadSignedPdf invoice={invoice} />}
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
