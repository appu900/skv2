"use client";

import type { AdminAnalytics } from "@/lib/api/analytics";
import { useItem } from "@/lib/api/use-item";
import { formatCurrency } from "@/lib/domain/stages";
import { VIZ } from "@/components/charts/charts";
import { ApprovalCard, CourseResultsCard, GenderCard, InsightsHeading, RankingCard, ResultsCard, StageCard, TrendCard } from "@/components/charts/insight-blocks";

export function AdminInsights() {
  const { data, isLoading } = useItem<AdminAnalytics>("/analytics/admin");
  const loading = isLoading || !data;
  return (
    <>
      <InsightsHeading
        description={
          data
            ? `${data.totals.candidates.toLocaleString("en-IN")} candidates in ${data.totals.batches} batches · ${data.totals.certificates} certificates issued · ${formatCurrency(data.totals.revenue)} in confirmed batch fees`
            : "How the whole awarding body is doing"
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendCard className="lg:col-span-2" title="Candidates enrolled" description="New candidates per month, last 12 months" monthly={data?.monthly} series={[{ key: "enrolled", label: "Candidates", color: VIZ[0] }]} loading={loading} />
        <ResultsCard results={data?.results} passRate={data?.totals.passRate} loading={loading} />
        <StageCard title="Batch pipeline" description="Where every batch stands" stages={data?.batchStages.filter((row) => row.count > 0)} loading={loading} />
        <RankingCard
          title="Top training partners"
          description="By candidates enrolled"
          valueLabel="Candidates"
          items={(data?.topPartners ?? []).map((row) => ({ label: row.name, value: row.candidates ?? 0, hint: `${row.batches} batch${row.batches === 1 ? "" : "es"}` }))}
          loading={loading}
          empty="No batches yet"
        />
        <RankingCard
          title="Candidates by scheme"
          valueLabel="Candidates"
          items={(data?.schemes ?? []).map((row) => ({ label: row.name, value: row.candidates ?? 0 }))}
          loading={loading}
          empty="No batches yet"
        />
        <CourseResultsCard className="lg:col-span-2" items={data?.courseResults} loading={loading} />
        <GenderCard gender={data?.gender} loading={loading} />
        <TrendCard className="lg:col-span-2" title="Certificates issued" description="Per month, last 12 months" monthly={data?.monthly} series={[{ key: "certificates", label: "Certificates", color: VIZ[2] }]} loading={loading} />
        <ApprovalCard title="Centre approvals" description="Scheme approvals across all centres" rows={data?.centres} loading={loading} />
      </div>
    </>
  );
}
