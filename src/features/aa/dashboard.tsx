"use client";

import { AgencyInsights } from "./insights";
import Link from "next/link";
import { BadgeCheck, CalendarCheck, CalendarClock, FileSpreadsheet, Receipt, TriangleAlert, UserPlus, Banknote } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { useList } from "@/lib/api/use-list";
import type { Exam } from "@/lib/api/models";
import { examStage } from "@/lib/domain/stages";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AssessmentAgencyDashboard() {
  const { data: session } = useSession();
  const exams = useList<Exam>(session ? `/exam/aa/${session.id}` : null);

  const list = exams.data ?? [];
  const stages = list.map((exam) => examStage(exam).label);
  const needAction = stages.filter((stage) => stage === "Assign assessor" || stage === "Schedule date").length;
  const pending = stages.filter((stage) => stage === "Assessment pending").length;
  const certified = stages.filter((stage) => stage === "Certified").length;
  const loading = !session || exams.isLoading;

  return (
    <>
      <DashboardHeader
        subtitle="Your assigned assessments and what to do next."
        actions={
          <Button asChild>
            <Link href="/aa/exams">
              <CalendarCheck />
              Open exams
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Assigned exams" value={list.length} hint="All time" icon={CalendarCheck} href="/aa/exams" loading={loading} />
        <StatCard label="Need action" value={needAction} hint="Assessor or date missing" icon={TriangleAlert} tone="warning" href="/aa/exams" loading={loading} />
        <StatCard label="Assessments pending" value={pending} hint="Results not uploaded yet" icon={CalendarClock} tone="info" href="/aa/exams" loading={loading} />
        <StatCard label="Certified" value={certified} hint="Certificates published" icon={BadgeCheck} tone="success" loading={loading} />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent exams</CardTitle>
            <CardDescription>Latest batches assigned to your agency</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/aa/exams">View all</Link>
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
              <EmptyState icon={CalendarCheck} title="No exams assigned yet" description="The awarding body assigns paid batches to your agency." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead className="hidden md:table-cell">Training partner</TableHead>
                    <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.slice(0, 6).map((exam) => (
                    <TableRow key={exam._id}>
                      <TableCell>
                        <p className="font-medium">{exam.course}</p>
                        <p className="text-xs text-muted-foreground">{exam.batchABN}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{exam.TrainingOrganization}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{exam.totalStudents ?? 0}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{exam.assesmentdate || "Not set"}</TableCell>
                      <TableCell className="text-right">
                        <StageBadge stage={examStage(exam)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { title: "Manage exams", description: "Assessor, date, attendance, marks", href: "/aa/exams", icon: FileSpreadsheet },
            { title: "Add an assessor", description: "Assessors you can assign", href: "/aa/assessors", icon: UserPlus },
            { title: "Generate invoice", description: "Monthly invoice for paid work", href: "/aa/invoices", icon: Receipt },
            { title: "Bank details", description: "Where your payments go", href: "/aa/bank-details", icon: Banknote },
          ]}
        />
      </div>

      <AgencyInsights />
    </>
  );
}
