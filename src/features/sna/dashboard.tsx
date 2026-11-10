"use client";

import { SnaInsights } from "./insights";
import Link from "next/link";
import { Layers, ListChecks, School, Users } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { useList } from "@/lib/api/use-list";
import type { Batch, Centre } from "@/lib/api/models";
import { formatDate } from "@/lib/domain/stages";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Rows() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

// The backend scopes every SNA call to the scheme and state inside the token.
export function SnaDashboard() {
  const { data: session } = useSession();
  const centres = useList<Centre>("/sna/centers/query");
  const pendingBatches = useList<Batch>("/sna/batch/query");
  const activeBatches = useList<Batch>("/sna/batches/all/query");
  const candidates = (activeBatches.data ?? []).reduce((sum, batch) => sum + (batch.students?.length || 0), 0);

  return (
    <>
      <DashboardHeader
        subtitle={`Approvals for ${session?.scheme ?? "your scheme"}${session?.state ? ` in ${session.state}` : ""}.`}
        actions={
          <Button asChild>
            <Link href="/sna/batch-approvals">
              <ListChecks />
              Review batches
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Centres to approve" value={centres.data?.length} hint="Applied for your scheme" icon={School} tone="warning" href="/sna/centres" loading={centres.isLoading} />
        <StatCard label="Batches to approve" value={pendingBatches.data?.length} hint="Submitted by training partners" icon={ListChecks} tone="warning" href="/sna/batch-approvals" loading={pendingBatches.isLoading} />
        <StatCard label="Active batches" value={activeBatches.data?.length} hint="Running under your scheme" icon={Layers} href="/sna/batches" loading={activeBatches.isLoading} />
        <StatCard label="Candidates" value={candidates} hint="In active batches" icon={Users} tone="info" loading={activeBatches.isLoading} />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batches waiting for approval</CardTitle>
            <CardDescription>Submitted by training partners under your scheme</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/sna/batch-approvals">Review</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {pendingBatches.isLoading ? (
              <Rows />
            ) : !pendingBatches.data?.length ? (
              <EmptyState icon={ListChecks} title="All caught up" description="No batches are waiting for your approval." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead className="hidden sm:table-cell">Training partner</TableHead>
                    <TableHead className="text-right">Starts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBatches.data.slice(0, 6).map((batch) => (
                    <TableRow key={batch._id}>
                      <TableCell>
                        <p className="font-medium">{batch.courseName}</p>
                        <p className="text-xs text-muted-foreground">{batch.ABN_Number || "—"}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{batch.trainingOrganization}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatDate(batch.startDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Centres waiting for approval</CardTitle>
            <CardDescription>Centres that applied for your scheme</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/sna/centres">Review</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {centres.isLoading ? (
              <Rows />
            ) : !centres.data?.length ? (
              <EmptyState icon={School} title="All caught up" description="No centres are waiting for your approval." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Centre</TableHead>
                    <TableHead className="hidden sm:table-cell">Training partner</TableHead>
                    <TableHead className="text-right">Schemes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centres.data.slice(0, 6).map((centre) => (
                    <TableRow key={centre._id}>
                      <TableCell className="font-medium">{centre.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {typeof centre.trainingOrganizationId === "object" ? centre.trainingOrganizationId?.organizationName : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{centre.schemes?.length ?? 0}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <SnaInsights />
    </>
  );
}
