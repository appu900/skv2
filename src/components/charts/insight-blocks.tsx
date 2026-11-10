"use client";

import type { CourseResult, KeyCount, MonthRow } from "@/lib/api/analytics";
import { BarList, ChartCard, DonutChart, formatMonth, PassFailBars, STATUS, TrendChart, VIZ, type TrendSeries } from "./charts";

// Ready-made dashboard cards shared by the four portals.

const count = (rows: KeyCount[], key: string) => rows.find((row) => row.key === key)?.count ?? 0;

export function TrendCard({ title, description, monthly, series, loading, className }: { title: string; description?: string; monthly?: MonthRow[]; series: TrendSeries[]; loading?: boolean; className?: string }) {
  // ** a month without records is 0, not a gap in the line
  const data = (monthly ?? []).map((row) => {
    const filled: Record<string, string | number> = { month: row.month };
    for (const item of series) filled[item.key] = Number(row[item.key as keyof MonthRow] ?? 0);
    return filled;
  });
  return (
    <ChartCard
      title={title}
      description={description}
      loading={loading}
      className={className}
      table={{ columns: ["Month", ...series.map((item) => item.label)], rows: data.map((row) => [formatMonth(String(row.month)), ...series.map((item) => Number(row[item.key] ?? 0))]) }}
    >
      <TrendChart data={data} series={series} />
    </ChartCard>
  );
}

export function ResultsCard({ results, passRate, loading }: { results?: KeyCount[]; passRate?: number | null; loading?: boolean }) {
  const rows = results ?? [];
  return (
    <ChartCard
      title="Assessment results"
      description={passRate !== null && passRate !== undefined ? `${passRate}% of assessed candidates passed` : "Pass and fail across all assessed candidates"}
      loading={loading}
      table={{ columns: ["Result", "Candidates"], rows: [["Passed", count(rows, "Pass")], ["Failed", count(rows, "Fail")]] }}
    >
      <DonutChart
        centerLabel="assessed"
        slices={[
          { key: "pass", label: "Passed", value: count(rows, "Pass"), color: STATUS.good },
          { key: "fail", label: "Failed", value: count(rows, "Fail"), color: STATUS.critical },
        ]}
      />
    </ChartCard>
  );
}

// ** colour follows the category (never its rank), so it stays the same when counts change
const GENDER_COLOUR: Record<string, string> = { Male: VIZ[0], Female: VIZ[1] };

export function GenderCard({ gender, loading }: { gender?: KeyCount[]; loading?: boolean }) {
  const rows = gender ?? [];
  const known = ["Male", "Female"];
  const other = rows.filter((row) => !known.includes(row.key)).reduce((sum, row) => sum + row.count, 0);
  const slices = [
    ...known.map((key) => ({ key, label: key, value: count(rows, key), color: GENDER_COLOUR[key] })),
    { key: "other", label: "Other", value: other, color: VIZ[2] },
  ];
  return (
    <ChartCard title="Candidates by gender" loading={loading} table={{ columns: ["Gender", "Candidates"], rows: slices.map((slice) => [slice.label, slice.value]) }}>
      <DonutChart centerLabel="candidates" slices={slices} />
    </ChartCard>
  );
}

export function ApprovalCard({ title, description, rows, loading }: { title: string; description?: string; rows?: KeyCount[]; loading?: boolean }) {
  const data = rows ?? [];
  const slices = [
    { key: "Approved", label: "Approved", value: count(data, "Approved"), color: STATUS.good },
    { key: "Pending", label: "Pending", value: count(data, "Pending"), color: STATUS.warning },
    { key: "Rejected", label: "Rejected", value: count(data, "Rejected"), color: STATUS.critical },
  ];
  return (
    <ChartCard title={title} description={description} loading={loading} table={{ columns: ["Status", "Count"], rows: slices.map((slice) => [slice.label, slice.value]) }}>
      <DonutChart centerLabel="total" slices={slices} />
    </ChartCard>
  );
}

export function StageCard({ title, description, stages, loading }: { title: string; description?: string; stages?: KeyCount[]; loading?: boolean }) {
  const rows = stages ?? [];
  return (
    <ChartCard title={title} description={description} loading={loading} table={{ columns: ["Stage", "Count"], rows: rows.map((row) => [row.key, row.count]) }}>
      <BarList items={rows.map((row) => ({ label: row.key, value: row.count }))} empty="No batches yet" />
    </ChartCard>
  );
}

export function GradeCard({ grades, loading }: { grades?: KeyCount[]; loading?: boolean }) {
  const order = ["A+", "A", "B", "C", "D", "E", "F"];
  const rows = [...(grades ?? [])].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return (
    <ChartCard title="Grade distribution" description="Grades of assessed candidates" loading={loading} table={{ columns: ["Grade", "Candidates"], rows: rows.map((row) => [row.key, row.count]) }}>
      <BarList items={rows.map((row) => ({ label: `Grade ${row.key}`, value: row.count }))} empty="No grades yet" />
    </ChartCard>
  );
}

export function CourseResultsCard({ items, loading, className }: { items?: CourseResult[]; loading?: boolean; className?: string }) {
  const rows = items ?? [];
  return (
    <ChartCard
      title="Pass rate by course"
      description="Passed and failed candidates per course"
      loading={loading}
      className={className}
      table={{ columns: ["Course", "Passed", "Failed"], rows: rows.map((row) => [row.name, row.passed, row.failed]) }}
    >
      <PassFailBars items={rows} />
    </ChartCard>
  );
}

export function RankingCard({
  title,
  description,
  items,
  valueLabel,
  loading,
  empty,
}: {
  title: string;
  description?: string;
  items: { label: string; value: number; hint?: string }[];
  valueLabel: string;
  loading?: boolean;
  empty?: string;
}) {
  return (
    <ChartCard title={title} description={description} loading={loading} table={{ columns: ["Name", valueLabel], rows: items.map((item) => [item.label, item.value]) }}>
      <BarList items={items} empty={empty} />
    </ChartCard>
  );
}

export function InsightsHeading({ title = "Insights", description }: { title?: string; description?: string }) {
  return (
    <div className="mt-10 mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
