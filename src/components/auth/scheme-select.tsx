"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Scheme {
  _id: string;
  name: string;
  schemeType: string;
}

// Public list of schemes, used where the backend expects a scheme name (SNA login).
export function SchemeSelect({ name, id }: { name: string; id?: string }) {
  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ["schemes"],
    queryFn: async () => (await api.get<ApiResponse<Scheme[]>>("/scheme")).data.data,
  });

  return (
    <Select name={name} required>
      <SelectTrigger id={id} className="h-11 w-full">
        <SelectValue placeholder={isLoading ? "Loading schemes…" : "Select your scheme"} />
      </SelectTrigger>
      <SelectContent>
        {schemes
          .filter((scheme) => scheme.schemeType !== "Corporate")
          .map((scheme) => (
            <SelectItem key={scheme._id} value={scheme.name}>
              {scheme.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
