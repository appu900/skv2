// Two column label / value list used in detail sheets and pages: each pair is a soft tinted tile.
export function DetailList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-2.5 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-xl border border-primary/10 bg-primary/[0.035] px-3.5 py-2.5 transition-colors hover:border-primary/25 dark:bg-primary/[0.07]">
          <dt className="text-[11px] font-semibold tracking-wide text-primary/80 uppercase">{label}</dt>
          <dd className="mt-1 text-sm font-medium break-words">{value || value === 0 ? value : <span className="text-muted-foreground">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
