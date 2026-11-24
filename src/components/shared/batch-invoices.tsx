"use client";

import { useState } from "react";
import { Download, Receipt } from "lucide-react";
import type { BatchInvoice } from "@/lib/api/models";
import { downloadFile } from "@/lib/api/download";
import { useList } from "@/lib/api/use-list";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = "all" | "unpaid" | "paid" | "cancelled";

const tabOf = (invoice: BatchInvoice): Exclude<Tab, "all"> => (invoice.cancelled ? "cancelled" : invoice.paymentStatus ? "paid" : "unpaid");

const STATUS: Record<Exclude<Tab, "all">, React.ReactNode> = {
  unpaid: <Badge variant="warning">Unpaid</Badge>,
  paid: <Badge variant="success">Paid</Badge>,
  cancelled: <Badge variant="outline">Cancelled</Badge>,
};

// The invoice PDF of one batch; the backend checks the batch belongs to the caller.
export function InvoiceDownloadButton({ batchId, invoiceNumber, size = "sm" }: { batchId: string; invoiceNumber?: string; size?: "sm" | "default" }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size={size}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await downloadFile(`/invoice/batch/${batchId}/pdf`, `${invoiceNumber ?? "invoice"}.pdf`);
        setBusy(false);
      }}
    >
      <Download />
      {busy ? "Preparing…" : "Invoice"}
    </Button>
  );
}

// Payment invoices of submitted batches: the training partner's own, or every one for the admin.
export function BatchInvoicesPage({ admin }: { admin?: boolean }) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const invoices = useList<BatchInvoice>("/invoice/batches");

  const list = invoices.data ?? [];
  const of = (value: Exclude<Tab, "all">) => list.filter((invoice) => tabOf(invoice) === value);
  const sum = (rows: BatchInvoice[]) => rows.reduce((total, invoice) => total + (invoice.amount || 0), 0);
  const rows = list
    .filter((invoice) => tab === "all" || tabOf(invoice) === tab)
    .filter((invoice) =>
      matches(search, invoice.invoiceNumber, invoice.BatchId?.ABN_Number, invoice.BatchId?.courseName, invoice.TrainingPartnerId?.organizationName)
    );

  return (
    <>
      <PageHeader
        title={admin ? "Batch invoices" : "Invoices"}
        description={
          admin
            ? "Payment invoices issued to training partners when they submit a batch."
            : "An invoice is issued for every batch you submit. Pay it and upload the proof under Payments."
        }
      />
      <StatGrid>
        <StatCard label="Unpaid" value={formatCurrency(sum(of("unpaid")))} hint={`${of("unpaid").length} invoice(s)`} icon={Receipt} tone="warning" loading={invoices.isLoading} />
        <StatCard label="Paid" value={formatCurrency(sum(of("paid")))} hint={`${of("paid").length} invoice(s)`} icon={Receipt} tone="success" loading={invoices.isLoading} />
        <StatCard label="Cancelled" value={of("cancelled").length} hint="Batches sent back for changes" icon={Receipt} loading={invoices.isLoading} />
      </StatGrid>
      <div className="mt-6">
        <ListCard
          toolbar={
            <>
              <StatusTabs<Tab>
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "all", label: "All", count: list.length },
                  { value: "unpaid", label: "Unpaid", count: of("unpaid").length },
                  { value: "paid", label: "Paid", count: of("paid").length },
                  { value: "cancelled", label: "Cancelled", count: of("cancelled").length },
                ]}
              />
              <div className="sm:ml-auto">
                <SearchInput value={search} onChange={setSearch} placeholder={admin ? "Search invoice, batch, partner…" : "Search invoice or batch…"} />
              </div>
            </>
          }
        >
          {invoices.isLoading ? (
            <LoadingRows />
          ) : rows.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices here" description="Invoices appear when a batch is submitted." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Batch</TableHead>
                  {admin && <TableHead className="hidden lg:table-cell">Training partner</TableHead>}
                  <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell>
                      <p className="font-mono text-sm font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.issuedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{invoice.BatchId?.ABN_Number ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{invoice.BatchId?.courseName}</p>
                    </TableCell>
                    {admin && (
                      <TableCell className="hidden lg:table-cell">
                        <p>{invoice.TrainingPartnerId?.organizationName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{invoice.TrainingPartnerId?.tpCode}</p>
                      </TableCell>
                    )}
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {invoice.candidates} × {formatCurrency(invoice.ratePerCandidate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(invoice.amount)}</p>
                      {invoice.gstAmount > 0 && <p className="text-xs text-muted-foreground">incl. GST {formatCurrency(invoice.gstAmount)}</p>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {STATUS[tabOf(invoice)]}
                      {invoice.cancelled && invoice.cancelReason && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{invoice.cancelReason}</p>}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.BatchId?._id && <InvoiceDownloadButton batchId={invoice.BatchId._id} invoiceNumber={invoice.invoiceNumber} />}
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
