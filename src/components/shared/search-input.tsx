"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

// Case-insensitive match of a search term against several fields of a record.
export function matches(term: string, ...fields: (string | number | undefined | null)[]) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => String(field ?? "").toLowerCase().includes(needle));
}
