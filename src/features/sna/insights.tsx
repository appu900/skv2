"use client";

import type { SnaAnalytics } from "@/lib/api/analytics";
import { useItem } from "@/lib/api/use-item";
import { VIZ } from "@/components/charts/charts";
import { ApprovalCard, CourseResultsCard, GenderCard, InsightsHeading, RankingCard, ResultsCard, StageCard, TrendCard } from "@/components/charts/insight-blocks";

export function SnaInsights() {
  const { data, isLoading } = useItem<SnaAnalytics>("/analytics/sna");
  const loading = isLoading || !data;
  return (
    <>
      <InsightsHeading
        description={
          data
            ? `${data.scope.scheme} in ${data.scope.state}: ${data.totals.candidates} candidates in ${data.totals.batches} batches from ${data.totals.partners} training partners`
            : "Your scheme at a glance"
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendCard className="lg:col-span-2" title="Batches created" description="Per month, last 12 months" monthly={data?.monthly} series={[{ key: "batches", label: "Batches", color: VIZ[0] }]} loading={loading} />
        <ApprovalCard title="Centre approvals" description="Your decisions on centres for this scheme" rows={data?.centres} loading={loading} />
        <StageCard title="Batch pipeline" description="Where every batch of your scheme stands" stages={data?.batchStages.filter((row) => row.count > 0)} loading={loading} />
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
