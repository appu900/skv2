"use client";

import { useState } from "react";
import { Ban, FileSpreadsheet, FileText, Receipt, RotateCcw, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { ToaInvoice, ToaPayment } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoneyStatusBadge, tpName } from "@/features/toa/labels";

type Tab = "unpaid" | "paid" | "refunded" | "cancelled" | "all";
const fileName = (value: string) => value.replaceAll("/", "-");

function Refund({ payment }: { payment: ToaPayment }) {
  const refund = useApiMutation((reason: string) => api.put(`/toa/admin/payments/${payment._id}/refund`, { reason }), "Refund recorded");
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <RotateCcw />
          Refund
        </Button>
      }
      title={`Refund ${formatCurrency(payment.amount)}?`}
      description={`The amount goes back through the payment gateway (transaction ${payment.paymentId}). The partner is notified.`}
      submitLabel="Refund"
      onSubmit={(form) => refund.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} />
    </FormDialog>
  );
}

function CancelInvoice({ invoice }: { invoice: ToaInvoice }) {
  const cancel = useApiMutation((reason: string) => api.put(`/toa/admin/invoices/${invoice._id}/cancel`, { reason }), "Invoice cancelled and raised again with the current fee");
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Ban />
          Cancel & reissue
        </Button>
      }
      title={`Cancel ${invoice.invoiceNumber}?`}
      description="Use this when the fee was wrong: correct the fee in ToA settings first. A new invoice with a new number is raised for the same batch."
      submitLabel="Cancel and reissue"
      onSubmit={(form) => cancel.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} />
    </FormDialog>
  );
}

export function ToaAdminPaymentsPage() {
  const [tab, setTab] = useState<Tab>("unpaid");
  const [search, setSearch] = useState("");
  const invoices = useList<ToaInvoice>("/toa/admin/invoices");
  const payments = useList<ToaPayment>("/toa/admin/payments");
  const list = invoices.data ?? [];
  const sum = (status: string) => list.filter((invoice) => invoice.status === status).reduce((total, invoice) => total + invoice.total, 0);
  const rows = list.filter((invoice) => (tab === "all" || invoice.status === tab) && matches(search, invoice.invoiceNumber, invoice.payer?.organizationName ?? "", invoice.batch?.batchCode ?? ""));

  return (
    <>
      <PageHeader
        title="ToA payments"
        description="Invoices are raised automatically on batch approval and paid online. Successful payments get a receipt; refunds go back through the gateway."
        actions={
          <Button variant="outline" onClick={() => downloadFile("/toa/admin/invoices.xlsx", "toa-invoices.xlsx")}>
            <FileSpreadsheet />
            Export invoices
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Invoiced" value={formatCurrency(list.filter((invoice) => invoice.status !== "cancelled").reduce((total, invoice) => total + invoice.total, 0))} icon={Wallet} loading={invoices.isLoading} />
        <StatCard label="Collected" value={formatCurrency(sum("paid"))} icon={Wallet} tone="success" loading={invoices.isLoading} />
        <StatCard label="Outstanding" value={formatCurrency(sum("unpaid"))} hint={`${list.filter((invoice) => invoice.status === "unpaid").length} invoice(s)`} icon={Wallet} tone="warning" loading={invoices.isLoading} />
        <StatCard label="Refunded" value={formatCurrency(sum("refunded"))} icon={Wallet} tone="info" loading={invoices.isLoading} />
      </StatGrid>
      <div className="mt-6 flex flex-col gap-6">
        <ListCard
          toolbar={
            <>
              <StatusTabs<Tab>
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "unpaid", label: "Unpaid", count: list.filter((invoice) => invoice.status === "unpaid").length },
                  { value: "paid", label: "Paid", count: list.filter((invoice) => invoice.status === "paid").length },
                  { value: "refunded", label: "Refunded", count: list.filter((invoice) => invoice.status === "refunded").length },
                  { value: "cancelled", label: "Cancelled", count: list.filter((invoice) => invoice.status === "cancelled").length },
                  { value: "all", label: "All", count: list.length },
                ]}
              />
              <div className="sm:ml-auto">
                <SearchInput value={search} onChange={setSearch} placeholder="Search invoice, partner, batch…" />
              </div>
            </>
          }
        >
          {invoices.isLoading ? (
            <LoadingRows />
          ) : rows.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices here" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden md:table-cell">Training partner</TableHead>
                  <TableHead className="hidden lg:table-cell">Batch</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(invoice.invoiceDate)} · due {formatDate(invoice.dueDate)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.payer?.organizationName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{invoice.batch?.batchCode ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <MoneyStatusBadge status={invoice.status} />
                      {invoice.cancelReason && <p className="mt-1 text-xs text-muted-foreground">{invoice.cancelReason}</p>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/admin/invoices/${invoice._id}/pdf`, `${fileName(invoice.invoiceNumber)}.pdf`)}>
                        <FileText />
                        PDF
                      </Button>
                      {invoice.status === "unpaid" && <CancelInvoice invoice={invoice} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ListCard>

        <ListCard toolbar={<h2 className="text-sm font-semibold">Transactions (reconciliation)</h2>}>
          {payments.isLoading ? (
            <LoadingRows />
          ) : !payments.data?.length ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Training partner</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden lg:table-cell">Gateway reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.data.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="text-muted-foreground">{formatDate(payment.createdAt)}</TableCell>
                    <TableCell className="hidden md:table-cell">{tpName(payment.toaTpId)}</TableCell>
                    <TableCell>{payment.invoice?.invoiceNumber}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {payment.paymentId ?? "—"}
                      <br />
                      {payment.orderId} · {payment.gateway}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <MoneyStatusBadge status={payment.status} />
                      {payment.refundReason && <p className="mt-1 text-xs text-muted-foreground">{payment.refundReason}</p>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {payment.receiptNumber && (
                        <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/admin/payments/${payment._id}/receipt`, `${fileName(payment.receiptNumber ?? "receipt")}.pdf`)}>
                          <Receipt />
                          Receipt
                        </Button>
                      )}
                      {["successful", "duplicate"].includes(payment.status) && <Refund payment={payment} />}
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
