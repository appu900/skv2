"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import type { Batch } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { batchStage, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { BatchResultsSheet } from "@/components/shared/batch-results-sheet";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrainingPartner } from "./use-training-partner";

export function ResultsPage() {
  const { tpId } = useTrainingPartner();
  const [search, setSearch] = useState("");
  const batches = useList<Batch>(tpId ? `/batch/tp/${tpId}` : null);
  // ** batches that reached assessment; marks and certificates only exist from there on
  const rows = (batches.data ?? [])
    .filter((batch) => batch.isAssigned || batch.certificateIssued)
    .filter((batch) => matches(search, batch.ABN_Number, batch.courseName, batch.centerName));

  return (
    <>
      <PageHeader title="Results & certificates" description="Marks of assessed batches and the certificates issued to passing candidates." />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search batches…" />}>
        {!tpId || batches.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Award} title="No assessed batches yet" description="Batches show up here once they are assigned for assessment." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Centre</TableHead>
                <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                <TableHead className="hidden lg:table-cell">Training ended</TableHead>
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
                  <TableCell className="hidden md:table-cell">{batch.centerName}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{batch.students?.length ?? 0}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(batch.endDate)}</TableCell>
                  <TableCell>
                    <StageBadge stage={batchStage(batch)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <BatchResultsSheet batch={batch} />
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
