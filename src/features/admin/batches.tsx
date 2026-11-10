"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import type { Batch } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { batchStage, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BatchSheet } from "@/components/shared/batch-sheet";

const STAGES = ["Draft", "Returned for changes", "Awaiting approval", "Payment due", "Payment under review", "Awaiting assessment", "In assessment", "Completed"];

export function BatchesPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const { data = [], isLoading } = useList<Batch>("/batch");

  const rows = data
    .filter((batch) => stage === "all" || batchStage(batch).label === stage)
    .filter((batch) =>
      matches(search, batch.ABN_Number, batch.courseName, batch.trainingOrganization, batch.centerName, batch.state, batch.scheme)
    );

  return (
    <>
      <PageHeader title="Batches" description={`${data.length} batches across all training partners.`} />
      <ListCard
        toolbar={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, course, partner, state…" />
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGES.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Layers} title="No batches" description="Nothing matches this filter." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Scheme</TableHead>
                <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                <TableHead className="hidden xl:table-cell">Starts</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <p className="font-medium">{batch.courseName}</p>
                    <p className="text-xs text-muted-foreground">{batch.ABN_Number || "—"}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p>{batch.trainingOrganization}</p>
                    <p className="text-xs text-muted-foreground">{batch.centerName}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p>{batch.scheme}</p>
                    <p className="text-xs text-muted-foreground">{batch.state}</p>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{batch.students.length}</TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(batch.startDate)}</TableCell>
                  <TableCell>
                    <StageBadge stage={batchStage(batch)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <BatchSheet batch={batch} />
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
