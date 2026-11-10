"use client";

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Charts follow the dataviz rules: validated palette slots (--viz-1..3), status colours only for pass/fail,
// one axis, thin marks, a hover tooltip on every mark and a table view of the same numbers.

export const VIZ = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)"] as const;
export const STATUS = { good: "var(--viz-good)", warning: "var(--viz-warning)", critical: "var(--viz-critical)" } as const;

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (value: number) => compact.format(value);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-10" -> "Oct", January also shows the year
export const formatMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return month === 1 ? `Jan ${String(year).slice(2)}` : MONTHS[month - 1];
};
const formatMonthLong = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
};

// ---------------------------------------------------------------- card with table view

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
}

export function ChartCard({
  title,
  description,
  table,
  loading,
  className,
  children,
}: {
  title: string;
  description?: string;
  table?: TableView;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {table && (
          <CardAction>
            <div className="flex rounded-lg border p-0.5" role="group" aria-label="View">
              {(["chart", "table"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  aria-pressed={view === option}
                  aria-label={option === "chart" ? "Show chart" : "Show table"}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                    view === option && "bg-muted text-foreground"
                  )}
                >
                  {option === "chart" ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
                </button>
              ))}
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-lg" />
        ) : view === "table" && table ? (
          <div className="max-h-64 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr>
                  {table.columns.map((column, index) => (
                    <th key={column} className={cn("px-3 py-2 text-left text-xs font-medium text-muted-foreground", index > 0 && "text-right")}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {row.map((cell, index) => (
                      <td key={index} className={cn("px-3 py-1.5", index > 0 && "text-right tabular-nums")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function Empty({ text = "No data yet" }: { text?: string }) {
  return <div className="flex h-44 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">{text}</div>;
}

// ---------------------------------------------------------------- tooltip

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color: string }[] }) {
  return (
    <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: row.color }} />
            {row.label}
          </span>
          <span className="font-medium text-foreground tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- trend (one unit per chart, max 3 series)

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

export function TrendChart({ data, series, height = 220 }: { data: Record<string, string | number>[]; series: TrendSeries[]; height?: number }) {
  const hasData = data.some((row) => series.some((item) => Number(row[item.key] ?? 0) > 0));
  if (!hasData) return <Empty text="Nothing in the last 12 months yet" />;
  const last = data[data.length - 1];
  return (
    <div className="flex flex-col gap-3">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4 text-xs">
          {series.map((item) => (
            <span key={item.key} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-0.5 w-3.5 rounded-full" style={{ background: item.color }} />
              {item.label}
              <span className="font-medium text-foreground tabular-nums">{Number(last?.[item.key] ?? 0)}</span>
              <span>this month</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              {series.map((item) => (
                <linearGradient key={item.key} id={`wash-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" minTickGap={12} />
            <YAxis allowDecimals={false} tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={44} />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeOpacity: 0.4 }}
              content={({ active, label, payload }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={formatMonthLong(String(label))}
                    rows={series.map((item) => ({
                      label: item.label,
                      value: Number(payload.find((entry) => entry.dataKey === item.key)?.value ?? 0).toLocaleString("en-IN"),
                      color: item.color,
                    }))}
                  />
                ) : null
              }
            />
            {series.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={`url(#wash-${item.key})`}
                dot={false}
                activeDot={{ r: 4.5, fill: item.color, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- bar list (one series: one colour)

export interface BarItem {
  label: string;
  value: number;
  hint?: string;
}

export function BarList({ items, color = VIZ[0], format = (value: number) => value.toLocaleString("en-IN"), empty }: { items: BarItem[]; color?: string; format?: (value: number) => string; empty?: string }) {
  const max = Math.max(0, ...items.map((item) => item.value));
  if (!items.length || max === 0) return <Empty text={empty} />;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="group" title={`${item.label}: ${format(item.value)}${item.hint ? ` · ${item.hint}` : ""}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format(item.value)}
              {item.hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{item.hint}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width,opacity] duration-500 group-hover:opacity-80"
              style={{ width: item.value > 0 ? `${Math.max(2, (item.value / max) * 100)}%` : "0%", background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- donut (part to whole, max 3-4 parts)

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  centerLabel,
  format = (value: number) => value.toLocaleString("en-IN"),
  formatCenter = formatCompact,
  showPercent = true,
}: {
  slices: Slice[];
  centerLabel: string;
  format?: (value: number) => string;
  formatCenter?: (value: number) => string;
  showPercent?: boolean;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return <Empty />;
  const visible = slices.filter((slice) => slice.value > 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={visible} dataKey="value" nameKey="label" innerRadius="68%" outerRadius="100%" paddingAngle={visible.length > 1 ? 2 : 0} stroke="var(--card)" strokeWidth={2} isAnimationActive={false}>
              {visible.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={String(payload[0].name)}
                    rows={[{ label: "Value", value: `${format(Number(payload[0].value))} (${Math.round((Number(payload[0].value) / total) * 100)}%)`, color: String(payload[0].payload.color) }]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{formatCenter(total)}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-sm" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="shrink-0 font-medium whitespace-nowrap tabular-nums">
              {format(slice.value)}
              {showPercent && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{Math.round((slice.value / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- pass / fail per course (status colours, stacked with a 2px gap)

export function PassFailBars({ items }: { items: { name: string; passed: number; failed: number }[] }) {
  const max = Math.max(0, ...items.map((item) => item.passed + item.failed));
  if (!items.length || max === 0) return <Empty text="No marks uploaded yet" />;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: STATUS.good }} />
          Passed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: STATUS.critical }} />
          Failed
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const total = item.passed + item.failed;
          return (
            <li key={item.name} title={`${item.name}: ${item.passed} passed, ${item.failed} failed`}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  <span className="font-medium text-foreground">{total ? Math.round((item.passed / total) * 100) : 0}%</span> pass · {item.passed}/{total}
                </span>
              </div>
              <div className="flex h-2.5 gap-0.5" style={{ width: `${Math.max(4, (total / max) * 100)}%` }}>
                {item.passed > 0 && <div className="h-full rounded-l-full last:rounded-r-full" style={{ flex: item.passed, background: STATUS.good }} />}
                {item.failed > 0 && <div className="h-full rounded-r-full first:rounded-l-full" style={{ flex: item.failed, background: STATUS.critical }} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
