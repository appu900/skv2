"use client";

import Link from "next/link";
import { Award, BadgeCheck, CalendarCheck, ClipboardList, IndianRupee, Layers, UserPlus, Users, Wallet } from "lucide-react";
import type { ToaDashboard as Kpis } from "@/lib/api/toa";
import { formatCurrency } from "@/lib/domain/stages";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { NotificationList } from "./notifications";
import type { ToaTrainingPartner } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DetailList } from "@/components/shared/detail-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  { icon: UserPlus, title: "Register assessors", text: "Add the people to be trained, with their documents. CUTM verifies each one." },
  { icon: Layers, title: "Form a batch", text: "Group verified assessors into a batch with dates, mode and venue, then submit it to CUTM." },
  { icon: CalendarCheck, title: "Record attendance", text: "Mark attendance per session once CUTM approves the batch." },
  { icon: IndianRupee, title: "Pay the fee", text: "Pay the batch invoice online and download the receipt." },
  { icon: BadgeCheck, title: "Certificates", text: "CUTM publishes results; assessors download their certificates." },
];

export function ToaDashboard() {
  const { data } = useItem<ToaTrainingPartner>("/toa/tp/me");
  const kpis = useItem<Kpis>("/toa/tp/dashboard");
  const k = kpis.data;

  return (
    <>
      <DashboardHeader
        subtitle={data ? `${data.organizationName} · ${data.tpCode}` : "RailTel Training of Assessors"}
        actions={
          <Button variant="outline" asChild>
            <Link href="/toa/profile">Account & password</Link>
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Assessors approved" value={k?.registrations.approved} hint={`${k?.registrations.pending ?? 0} with CUTM · ${k?.registrations.correction ?? 0} to correct`} icon={Users} href="/toa/assessors" loading={kpis.isLoading} />
        <StatCard label="Batches running" value={k?.batches.approved} hint={`${k?.batches.submitted ?? 0} awaiting CUTM · ${k?.batches.draft ?? 0} drafts`} icon={Layers} tone="info" href="/toa/batches" loading={kpis.isLoading} />
        <StatCard label="Amount due" value={k ? formatCurrency(k.finance.pending) : undefined} hint={`${k?.finance.unpaidInvoices ?? 0} unpaid invoice(s)`} icon={Wallet} tone="warning" href="/toa/payments" loading={kpis.isLoading} />
        <StatCard label="Certificates issued" value={k?.certification.certificatesIssued} hint={`${k?.batches.completed ?? 0} batch(es) completed`} icon={Award} tone="success" loading={kpis.isLoading} />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Latest from CUTM</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationList base="/toa/tp" limit={5} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4" />
              Your account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && (
              <DetailList
                items={[
                  ["Code", data.tpCode],
                  ["Status", <Badge key="status" variant="success">Active</Badge>],
                  ["Contact", data.contactPerson],
                  ["Last login", formatDate(data.lastLoginAt)],
                  ["Created by", data.createdByAdmin ? "CUTM admin" : "Self registration"],
                ]}
              />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">How the programme works</CardTitle>
            <CardDescription>From registration to certificate.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3 rounded-lg border p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      {index + 1}. {step.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
