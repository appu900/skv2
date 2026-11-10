"use client";

import Link from "next/link";
import { Award, Layers, Users, Wallet } from "lucide-react";
import type { ToaDashboard } from "@/lib/api/toa";
import { useItem } from "@/lib/api/use-item";
import { formatCurrency } from "@/lib/domain/stages";
import { VIZ } from "@/components/charts/charts";
import { ApprovalCard, TrendCard } from "@/components/charts/insight-blocks";
import { PageHeader } from "@/components/portal/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// last 12 months, zero-filled, oldest first
function lastYear(rows: { month: string; certificates: number }[] = []) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { month, certificates: rows.find((row) => row.month === month)?.certificates ?? 0 };
  });
}

function Figures({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function ToaOverviewPage() {
  const { data, isLoading } = useItem<ToaDashboard>("/toa/admin/dashboard");
  const loading = isLoading || !data;
  return (
    <>
      <PageHeader
        title="RailTel ToA"
        description="Training of Assessors programme: registrations, batches, money and certificates."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/toa/reports">Reports</Link>
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Applications to verify" value={data?.registrations.pending} hint={`${data?.registrations.total ?? 0} registered in all`} icon={Users} tone="warning" href="/admin/toa/assessors" loading={loading} />
        <StatCard label="Batches to review" value={data?.batches.submitted} hint={`${data?.batches.approved ?? 0} running`} icon={Layers} tone="warning" href="/admin/toa/batches" loading={loading} />
        <StatCard label="Collected" value={data ? formatCurrency(data.finance.collected) : undefined} hint={`${data ? formatCurrency(data.finance.pending) : "—"} outstanding`} icon={Wallet} tone="success" href="/admin/toa/payments" loading={loading} />
        <StatCard label="Certificates issued" value={data?.certification.certificatesIssued} hint={`results pending for ${data?.certification.resultsPending ?? 0} batch(es)`} icon={Award} tone="info" href="/admin/toa/certificates" loading={loading} />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ApprovalCard
          title="Assessor registrations"
          description="Verification status"
          rows={data ? [{ key: "Approved", count: data.registrations.approved }, { key: "Pending", count: data.registrations.pending + data.registrations.correction }, { key: "Rejected", count: data.registrations.rejected }] : undefined}
          loading={loading}
        />
        <TrendCard className="lg:col-span-2" title="Certificates issued" description="Per month, last 12 months" monthly={data ? lastYear(data.monthly) : undefined} series={[{ key: "certificates", label: "Certificates", color: VIZ[0] }]} loading={loading} />
        <Figures
          title="Batch status"
          rows={data ? [["Draft / returned", data.batches.draft], ["Submitted", data.batches.submitted], ["Approved", data.batches.approved], ["Completed", data.batches.completed]] : []}
        />
        <Figures
          title="Financial summary"
          rows={data ? [["Invoiced", formatCurrency(data.finance.invoiced)], ["Collected", formatCurrency(data.finance.collected)], ["Pending", formatCurrency(data.finance.pending)], ["Refunded", formatCurrency(data.finance.refunded)]] : []}
        />
        <Figures
          title="Certification"
          rows={data ? [["Results pending", data.certification.resultsPending], ["Certificates issued", data.certification.certificatesIssued], ["Registrations", data.registrations.total], ["Rejected", data.registrations.rejected]] : []}
        />
      </div>
    </>
  );
}
