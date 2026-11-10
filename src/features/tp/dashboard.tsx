"use client";

import { TrainingPartnerInsights } from "./insights";
import Link from "next/link";
import { Award, CircleCheck, Layers, Plus, School, Upload, Users, Wallet } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { useList } from "@/lib/api/use-list";
import type { Batch, Centre } from "@/lib/api/models";
import { batchStage, formatDate } from "@/lib/domain/stages";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PIPELINE = ["Draft", "Awaiting approval", "Payment due", "Payment under review", "Awaiting assessment", "In assessment", "Completed"];

export function TrainingPartnerDashboard() {
  const { data: session } = useSession();
  const batches = useList<Batch>(session ? `/batch/tp/${session.id}` : null);
  const centres = useList<Centre>(session ? `/center/tp/${session.id}` : null);

  const list = batches.data ?? [];
  const stages = list.map((batch) => batchStage(batch).label);
  const candidates = list.reduce((sum, batch) => sum + (batch.students?.length || 0), 0);
  const paymentsDue = stages.filter((stage) => stage === "Payment due").length;
  const completed = stages.filter((stage) => stage === "Completed").length;
  const loading = !session || batches.isLoading;

  return (
    <>
      <DashboardHeader
        subtitle="Track your batches from creation to certificates."
        actions={
          <Button asChild>
            <Link href="/tp/batches">
              <Plus />
              New batch
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Batches" value={list.length} hint={`${centres.data?.length ?? 0} centres`} icon={Layers} href="/tp/batches" loading={loading} />
        <StatCard label="Candidates" value={candidates} hint="Across all batches" icon={Users} tone="info" loading={loading} />
        <StatCard label="Payments due" value={paymentsDue} hint="Upload proof to continue" icon={Wallet} tone="warning" href="/tp/payments" loading={loading} />
        <StatCard label="Completed batches" value={completed} hint="Certificates issued" icon={CircleCheck} tone="success" href="/tp/results" loading={loading} />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent batches</CardTitle>
            <CardDescription>Your latest batches and where each one stands</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tp/batches">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <EmptyState icon={Layers} title="No batches yet" description="Create your first batch to start enrolling candidates." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead className="hidden md:table-cell">Centre</TableHead>
                    <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                    <TableHead className="hidden lg:table-cell">Starts</TableHead>
                    <TableHead className="text-right">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.slice(0, 6).map((batch) => (
                    <TableRow key={batch._id}>
                      <TableCell>
                        <p className="font-medium">{batch.courseName}</p>
                        <p className="text-xs text-muted-foreground">{batch.ABN_Number || "—"}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{batch.centerName}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{batch.students?.length || 0}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(batch.startDate)}</TableCell>
                      <TableCell className="text-right">
                        <StageBadge stage={batchStage(batch)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Batch pipeline</CardTitle>
              <CardDescription>How many batches are at each step</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {PIPELINE.map((stage) => {
                const count = stages.filter((label) => label === stage).length;
                return (
                  <div key={stage} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stage}</span>
                      <span className="font-medium tabular-nums">{loading ? "–" : count}</span>
                    </div>
                    <Progress value={list.length ? (count / list.length) * 100 : 0} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <QuickActions
            actions={[
              { title: "Create a batch", description: "Then add candidates and trainers", href: "/tp/batches", icon: Plus },
              { title: "Add a centre", description: "Sent to the SNA for approval", href: "/tp/centres", icon: School },
              { title: "Upload payment proof", description: "For submitted batches", href: "/tp/payments", icon: Upload },
              { title: "Download certificates", description: "Completed batches", href: "/tp/results", icon: Award },
            ]}
          />
        </div>
      </div>

      <TrainingPartnerInsights />
    </>
  );
}
