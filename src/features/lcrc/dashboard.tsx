"use client";

import Link from "next/link";
import { Award, ListChecks, School, Users } from "lucide-react";
import type { LcrcAnalytics } from "@/lib/api/analytics";
import { useItem } from "@/lib/api/use-item";
import { useSession } from "@/lib/auth/use-session";
import { VIZ } from "@/components/charts/charts";
import { ApprovalCard, CourseResultsCard, GenderCard, InsightsHeading, RankingCard, ResultsCard, StageCard, TrendCard } from "@/components/charts/insight-blocks";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";

// Everything corporate in one place: what waits for the LC/RC, then the overall picture.
export function LcrcDashboard() {
  const { data: session } = useSession();
  const { data, isLoading } = useItem<LcrcAnalytics>("/analytics/lcrc");
  const loading = isLoading || !data;
  const totals = data?.totals;

  return (
    <>
      <DashboardHeader
        subtitle={`Corporate approvals${session?.name ? ` for ${session.name}` : ""}.`}
        actions={
          <Button asChild>
            <Link href="/lcrc/results">
              <Award />
              Review results
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Centres to approve" value={totals?.pendingCentres} hint="Corporate scheme requests" icon={School} tone="warning" href="/lcrc/centres" loading={loading} />
        <StatCard label="Batches to approve" value={totals?.pendingBatches} hint="Submitted by training partners" icon={ListChecks} tone="warning" href="/lcrc/batches" loading={loading} />
        <StatCard label="Results to review" value={totals?.pendingResults} hint="Uploaded by assessment agencies" icon={Award} tone="warning" href="/lcrc/results" loading={loading} />
        <StatCard label="Candidates" value={totals?.candidates} hint={`${totals?.batches ?? 0} corporate batches`} icon={Users} tone="info" loading={loading} />
      </StatGrid>

      <InsightsHeading
        description={data ? `${data.totals.candidates} candidates in ${data.totals.batches} corporate batches from ${data.totals.partners} training partners, ${data.totals.certificates} certificates issued` : "Corporate training at a glance"}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendCard
          className="lg:col-span-2"
          title="Batches and certificates"
          description="Per month, last 12 months"
          monthly={data?.monthly}
          series={[
            { key: "batches", label: "Batches", color: VIZ[0] },
            { key: "certificates", label: "Certificates", color: VIZ[1] },
          ]}
          loading={loading}
        />
        <ApprovalCard title="Centre approvals" description="Corporate schemes across all centres" rows={data?.centres} loading={loading} />
        <StageCard title="Batch pipeline" description="Where every corporate batch stands" stages={data?.batchStages.filter((row) => row.count > 0)} loading={loading} />
        <RankingCard
          title="Training partners"
          description="By candidates enrolled"
          valueLabel="Candidates"
          items={(data?.topPartners ?? []).map((row) => ({ label: row.name, value: row.candidates ?? 0, hint: `${row.batches} batch${row.batches === 1 ? "" : "es"}` }))}
          loading={loading}
          empty="No batches yet"
        />
        <ResultsCard results={data?.results} passRate={data?.totals.passRate} loading={loading} />
        <CourseResultsCard className="lg:col-span-2" items={data?.courseResults} loading={loading} />
        <GenderCard gender={data?.gender} loading={loading} />
      </div>
    </>
  );
}
