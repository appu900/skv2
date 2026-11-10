"use client";

import { AdminInsights } from "./insights";
import Link from "next/link";
import { Award, Building2, CalendarCheck, ClipboardCheck, Inbox, Landmark, MapPinned, Wallet, Coins } from "lucide-react";
import { useList } from "@/lib/api/use-list";
import type { AssessmentAgency, Batch, TrainingPartner } from "@/lib/api/models";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const pendingTps = useList<TrainingPartner>("/tp/status/pending");
  const pendingAas = useList<AssessmentAgency>("/aa/status/pending");
  const payments = useList<Batch>("/batch/all/paymentnotification");
  const corporate = useList<Batch>("/batch/all/corporate");

  return (
    <>
      <DashboardHeader
        subtitle="Here is what needs your attention across the awarding body today."
        actions={
          <Button asChild>
            <Link href="/admin/exams">
              <CalendarCheck />
              Assign exam
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Training partner applications" value={pendingTps.data?.length} hint="Waiting for review" icon={Building2} href="/admin/training-partners" loading={pendingTps.isLoading} />
        <StatCard label="Agency applications" value={pendingAas.data?.length} hint="Waiting for review" icon={ClipboardCheck} tone="info" href="/admin/assessment-agencies" loading={pendingAas.isLoading} />
        <StatCard label="Payments to confirm" value={payments.data?.length} hint="Proof uploaded by training partners" icon={Wallet} tone="warning" href="/admin/payments" loading={payments.isLoading} />
        <StatCard label="Corporate fees to set" value={corporate.data?.length} hint="Submitted corporate batches" icon={Coins} tone="success" href="/admin/payments" loading={corporate.isLoading} />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pending applications</CardTitle>
            <CardDescription>Organisations waiting to be approved</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tp">
              <TabsList>
                <TabsTrigger value="tp">
                  Training partners <Badge variant="secondary">{pendingTps.data?.length ?? 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="aa">
                  Agencies <Badge variant="secondary">{pendingAas.data?.length ?? 0}</Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tp" className="mt-4">
                {pendingTps.isLoading ? (
                  <RowsSkeleton />
                ) : !pendingTps.data?.length ? (
                  <EmptyState icon={Inbox} title="No pending applications" description="New training partner sign-ups appear here." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organisation</TableHead>
                        <TableHead>Scheme</TableHead>
                        <TableHead className="hidden md:table-cell">State</TableHead>
                        <TableHead className="text-right">Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTps.data.slice(0, 6).map((tp) => (
                        <TableRow key={tp._id}>
                          <TableCell className="font-medium">{tp.organizationName}</TableCell>
                          <TableCell>{tp.scheme || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell">{tp.registeredOfficeState || "—"}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatDate(tp.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="aa" className="mt-4">
                {pendingAas.isLoading ? (
                  <RowsSkeleton />
                ) : !pendingAas.data?.length ? (
                  <EmptyState icon={Inbox} title="No pending applications" description="New assessment agency sign-ups appear here." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-right">Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAas.data.slice(0, 6).map((aa) => (
                        <TableRow key={aa._id}>
                          <TableCell className="font-medium">{aa.agencyName}</TableCell>
                          <TableCell className="hidden md:table-cell">{aa.email || "—"}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatDate(aa.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { title: "Assign an exam", description: "Send a paid batch to an agency", href: "/admin/exams", icon: CalendarCheck },
            { title: "Publish certificates", description: "For completed assessments", href: "/admin/certificates", icon: Award },
            { title: "Create a scheme", description: "Logo, type and price per candidate", href: "/admin/schemes", icon: Landmark },
            { title: "Add an SNA account", description: "State nodal agency login", href: "/admin/sna", icon: MapPinned },
          ]}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Payments awaiting confirmation</CardTitle>
          <CardDescription>Training partners have uploaded proof of payment for these batches</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/payments">View all</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {payments.isLoading ? (
            <RowsSkeleton />
          ) : !payments.data?.length ? (
            <EmptyState icon={Wallet} title="Nothing to confirm" description="Uploaded payments show up here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Training partner</TableHead>
                  <TableHead className="hidden md:table-cell">Scheme</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.data.slice(0, 6).map((batch) => (
                  <TableRow key={batch._id}>
                    <TableCell>
                      <p className="font-medium">{batch.ABN_Number || "—"}</p>
                      <p className="text-xs text-muted-foreground">{batch.courseName}</p>
                    </TableCell>
                    <TableCell>{batch.trainingOrganization}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{batch.schemeType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(batch.amountToPaid)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminInsights />
    </>
  );
}
