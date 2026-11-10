"use client";

import { FileText, Receipt, Wallet } from "lucide-react";
import { downloadFile } from "@/lib/api/download";
import type { ToaInvoice, ToaPayment } from "@/lib/api/toa";
import { useList } from "@/lib/api/use-list";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayButton } from "./checkout";
import { MoneyStatusBadge } from "./labels";

const fileName = (value: string) => value.replaceAll("/", "-");

export function ToaPaymentsPage() {
  const invoices = useList<ToaInvoice>("/toa/tp/invoices");
  const payments = useList<ToaPayment>("/toa/tp/payments");
  const list = invoices.data ?? [];
  const total = (status: string) => list.filter((invoice) => invoice.status === status).reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <>
      <PageHeader title="Payments" description="An invoice is raised when CUTM approves a batch. Pay online; the receipt is issued as soon as the payment is confirmed." />
      <StatGrid>
        <StatCard label="Due" value={formatCurrency(total("unpaid"))} hint={`${list.filter((invoice) => invoice.status === "unpaid").length} invoice(s)`} icon={Wallet} tone="warning" loading={invoices.isLoading} />
        <StatCard label="Paid" value={formatCurrency(total("paid"))} icon={Wallet} tone="success" loading={invoices.isLoading} />
        <StatCard label="Refunded" value={formatCurrency(total("refunded"))} icon={Wallet} loading={invoices.isLoading} />
      </StatGrid>
      <div className="mt-6 flex flex-col gap-6">
        <ListCard toolbar={<h2 className="text-sm font-semibold">Invoices</h2>}>
          {invoices.isLoading ? (
            <LoadingRows />
          ) : list.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices yet" description="An invoice appears here when CUTM approves one of your batches." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden md:table-cell">Batch</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.batch?.batchCode}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <MoneyStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/tp/invoices/${invoice._id}/pdf`, `${fileName(invoice.invoiceNumber)}.pdf`)}>
                        <FileText />
                        Invoice
                      </Button>
                      {invoice.status === "unpaid" && <PayButton invoice={invoice} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ListCard>

        <ListCard toolbar={<h2 className="text-sm font-semibold">Payment attempts</h2>}>
          {payments.isLoading ? (
            <LoadingRows />
          ) : !payments.data?.length ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden md:table-cell">Transaction</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.data.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="text-muted-foreground">{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{payment.invoice?.invoiceNumber}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{payment.paymentId ?? payment.orderId}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <MoneyStatusBadge status={payment.status} />
                      {payment.failureReason && <p className="mt-1 text-xs text-muted-foreground">{payment.failureReason}</p>}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.receiptNumber && (
                        <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/tp/payments/${payment._id}/receipt`, `${fileName(payment.receiptNumber ?? "receipt")}.pdf`)}>
                          <Receipt />
                          Receipt
                        </Button>
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
