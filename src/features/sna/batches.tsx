"use client";

import { useState } from "react";
import { Award, Layers } from "lucide-react";
import type { Batch } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { useSession } from "@/lib/auth/use-session";
import { batchStage, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { BatchResultsSheet } from "@/components/shared/batch-results-sheet";
import { BatchSheet } from "@/components/shared/batch-sheet";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = "all" | "approval" | "payment" | "assessment" | "completed";

const tabOf = (batch: Batch): Exclude<Tab, "all"> => {
  const stage = batchStage(batch).label;
  if (stage === "Awaiting approval") return "approval";
  if (stage === "Completed") return "completed";
  if (stage === "In assessment" || stage === "Awaiting assessment") return "assessment";
  return "payment";
};

// All submitted batches of the SNA's scheme and state; `results` limits it to assessed ones.
function SnaBatchList({ results }: { results?: boolean }) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const batches = useList<Batch>("/sna/batches/all/query");

  const list = (batches.data ?? []).filter((batch) => !results || batch.isAssigned || batch.certificateIssued);
  const count = (value: Exclude<Tab, "all">) => list.filter((batch) => tabOf(batch) === value).length;
  const rows = list
    .filter((batch) => results || tab === "all" || tabOf(batch) === tab)
    .filter((batch) => matches(search, batch.ABN_Number, batch.courseName, batch.trainingOrganization, batch.centerName));

  return (
    <>
      <PageHeader
        title={results ? "Results" : "Batches"}
        description={
          results
            ? "Marks and certificates of assessed batches in your scheme."
            : `Every submitted ${session?.scheme ?? ""} batch in ${session?.state ?? "your state"}, with candidates and trainers.`
        }
      />
      <ListCard
        toolbar={
          <>
            {!results && (
              <StatusTabs<Tab>
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "all", label: "All", count: list.length },
                  { value: "approval", label: "Awaiting approval", count: count("approval") },
                  { value: "payment", label: "Payment", count: count("payment") },
                  { value: "assessment", label: "Assessment", count: count("assessment") },
                  { value: "completed", label: "Completed", count: count("completed") },
                ]}
              />
            )}
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, partner, course…" />
            </div>
          </>
        }
      >
        {batches.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={results ? Award : Layers} title={results ? "No assessed batches yet" : "No batches here"} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Centre</TableHead>
                <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                <TableHead className="hidden xl:table-cell">Training</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <p className="font-medium">{batch.ABN_Number}</p>
                    <p className="text-xs text-muted-foreground">{batch.courseName}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{batch.trainingOrganization}</TableCell>
                  <TableCell className="hidden lg:table-cell">{batch.centerName}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{batch.students?.length ?? 0}</TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={batchStage(batch)} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {results ? <BatchResultsSheet batch={batch} /> : <BatchSheet batch={batch} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}

export function SnaBatchesPage() {
  return <SnaBatchList />;
}

export function SnaResultsPage() {
  return <SnaBatchList results />;
}
