import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TONES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-chart-2/15 text-chart-2",
} as const;

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  href?: string;
  loading?: boolean;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary", href, loading }: StatCardProps) {
  const body = (
    <Card className={cn("group relative overflow-hidden transition-all", href && "hover:-translate-y-0.5 hover:shadow-md")}>
      <CardContent className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value ?? 0}</p>
          )}
          {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
      {href && (
        <ArrowUpRight className="absolute right-3 bottom-3 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
