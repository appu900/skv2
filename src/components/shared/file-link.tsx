import { FileText } from "lucide-react";

export function FileLink({ href, label }: { href?: string; label: string }) {
  if (!href) return <span className="text-sm text-muted-foreground">Not uploaded</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-chart-2/30 bg-chart-2/10 px-3 py-1 text-sm font-medium text-chart-2 transition-colors hover:bg-chart-2/20"
    >
      <FileText className="size-4" />
      {label}
    </a>
  );
}
