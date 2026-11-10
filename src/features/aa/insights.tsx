"use client";

import type { AgencyAnalytics } from "@/lib/api/analytics";
import { useItem } from "@/lib/api/use-item";
import { formatCurrency } from "@/lib/domain/stages";
import { ChartCard, DonutChart, STATUS, VIZ } from "@/components/charts/charts";
import { CourseResultsCard, GradeCard, InsightsHeading, RankingCard, ResultsCard, StageCard, TrendCard } from "@/components/charts/insight-blocks";

export function AgencyInsights() {
  const { data, isLoading } = useItem<AgencyAnalytics>("/analytics/aa");
  const loading = isLoading || !data;
  const earnings = [
    { key: "paid", label: "Paid", value: data?.totals.earningsPaid ?? 0, color: STATUS.good },
    { key: "unpaid", label: "Unpaid", value: data?.totals.earningsUnpaid ?? 0, color: STATUS.warning },
  ];
  return (
    <>
      <InsightsHeading
        description={
          data
            ? `${data.totals.assessed} of ${data.totals.candidates} candidates assessed in ${data.totals.exams} exams · ${data.totals.certificates} certified · ${data.totals.assessors} assessor${data.totals.assessors === 1 ? "" : "s"}`
            : "Your assessments at a glance"
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendCard
          className="lg:col-span-2"
          title="Candidates assessed"
          description="Candidates present at your assessments per month"
          monthly={data?.monthly}
          series={[{ key: "assessed", label: "Assessed", color: VIZ[0] }]}
          loading={loading}
        />
        <ResultsCard results={data?.results} passRate={data?.totals.passRate} loading={loading} />
        <StageCard title="Exam pipeline" description="Where every assigned exam stands" stages={data?.examStages.filter((row) => row.count > 0)} loading={loading} />
        <RankingCard
          title="Assessor workload"
          description="Exams per assessor"
          valueLabel="Exams"
          items={(data?.assessors ?? []).map((row) => ({ label: row.name, value: row.exams ?? 0, hint: `${row.candidates} candidates` }))}
          loading={loading}
          empty="No assessor assigned yet"
        />
        <GradeCard grades={data?.grades} loading={loading} />
        <CourseResultsCard className="lg:col-span-2" items={data?.courseResults} loading={loading} />
        <ChartCard title="Earnings" description="Invoiced amounts" loading={loading} table={{ columns: ["Status", "Amount"], rows: earnings.map((row) => [row.label, formatCurrency(row.value)]) }}>
          <DonutChart centerLabel="invoiced" slices={earnings} format={formatCurrency} formatCenter={(value) => formatCurrency(value)} showPercent={false} />
        </ChartCard>
      </div>
    </>
  );
}
