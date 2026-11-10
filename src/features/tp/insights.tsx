"use client";

import type { TrainingPartnerAnalytics } from "@/lib/api/analytics";
import { useItem } from "@/lib/api/use-item";
import { VIZ } from "@/components/charts/charts";
import { ApprovalCard, CourseResultsCard, GenderCard, GradeCard, InsightsHeading, RankingCard, ResultsCard, TrendCard } from "@/components/charts/insight-blocks";

export function TrainingPartnerInsights() {
  const { data, isLoading } = useItem<TrainingPartnerAnalytics>("/analytics/tp");
  const loading = isLoading || !data;
  return (
    <>
      <InsightsHeading
        description={
          data
            ? `${data.totals.candidates} candidates across ${data.totals.centres} centre${data.totals.centres === 1 ? "" : "s"} and ${data.totals.trainers} trainer${data.totals.trainers === 1 ? "" : "s"} · ${data.totals.certificates} certified`
            : "Your training at a glance"
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendCard
          className="lg:col-span-2"
          title="Candidates enrolled"
          description="Candidates you added per month, last 12 months"
          monthly={data?.monthly}
          series={[{ key: "enrolled", label: "Candidates", color: VIZ[0] }]}
          loading={loading}
        />
        <ResultsCard results={data?.results} passRate={data?.totals.passRate} loading={loading} />
        <RankingCard
          title="Candidates per centre"
          valueLabel="Candidates"
          items={(data?.centres ?? []).map((row) => ({ label: row.name, value: row.candidates ?? 0, hint: `${row.batches} batch${row.batches === 1 ? "" : "es"}` }))}
          loading={loading}
          empty="No batches yet"
        />
        <RankingCard title="Candidates per course" valueLabel="Candidates" items={(data?.courses ?? []).map((row) => ({ label: row.name, value: row.candidates ?? 0 }))} loading={loading} empty="No batches yet" />
        <GradeCard grades={data?.grades} loading={loading} />
        <CourseResultsCard className="lg:col-span-2" items={data?.courseResults} loading={loading} />
        <GenderCard gender={data?.gender} loading={loading} />
        <ApprovalCard title="Centre scheme approvals" description="SNA decisions on your centres" rows={data?.centreApprovals} loading={loading} />
      </div>
    </>
  );
}
