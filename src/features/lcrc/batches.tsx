"use client";

import { useState } from "react";
import { BadgeCheck, ListChecks, Undo2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Batch } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { batchStage, formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { BatchSheet } from "@/components/shared/batch-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = "pending" | "all";

function ApproveBatch({ batch }: { batch: Batch }) {
  const approve = useApiMutation(() => api.put(`/lcrc/batch/approve/${batch._id}`), `Batch ${batch.ABN_Number} approved`);
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm">
          <BadgeCheck />
          Approve
        </Button>
      }
      title={`Approve batch ${batch.ABN_Number}?`}
      description={`${batch.students?.length ?? 0} candidate(s) of ${batch.trainingOrganization}. The training partner can then pay ${formatCurrency(batch.amountToPaid)} and the batch goes to assessment.`}
      confirmLabel="Approve batch"
      onConfirm={() => approve.mutateAsync(undefined)}
    />
  );
}

function RejectBatch({ batch }: { batch: Batch }) {
  const reject = useApiMutation((reason: string) => api.put(`/lcrc/batch/reject/${batch._id}`, { reason }), `Batch ${batch.ABN_Number} sent back`);
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Undo2 />
          Reject
        </Button>
      }
      title={`Reject batch ${batch.ABN_Number}?`}
      description="The batch goes back to the training partner as a draft with your reason. They can fix it and submit it again."
      submitLabel="Send back"
      onSubmit={(form) => reject.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} placeholder="e.g. Two candidates have the same Aadhaar number" />
    </FormDialog>
  );
}

export function LcrcBatchesPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const pending = useList<Batch>("/lcrc/batches?status=pending");
  const all = useList<Batch>("/lcrc/batches");

  const source = tab === "pending" ? pending : all;
  const rows = (source.data ?? []).filter((batch) => matches(search, batch.ABN_Number, batch.courseName, batch.trainingOrganization, batch.centerName, batch.scheme));

  return (
    <>
      <PageHeader title="Batches" description="Corporate batches. Approve submitted batches after checking the candidates; rejected ones go back to the training partner." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "pending", label: "Awaiting approval", count: pending.data?.length },
                { value: "all", label: "All corporate batches", count: all.data?.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, partner, course…" />
            </div>
          </>
        }
      >
        {source.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={ListChecks} title={tab === "pending" ? "Nothing to approve" : "No corporate batches"} description="Submitted corporate batches appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Scheme</TableHead>
                <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                <TableHead className="hidden xl:table-cell">Training</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => {
                const waiting = batch.batchActivePermission && !batch.approvedByGovernmentBody;
                return (
                  <TableRow key={batch._id}>
                    <TableCell>
                      <p className="font-medium">{batch.ABN_Number || "Draft"}</p>
                      <p className="text-xs text-muted-foreground">{batch.courseName}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{batch.trainingOrganization}</TableCell>
                    <TableCell className="hidden lg:table-cell">{batch.scheme}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{batch.students?.length ?? 0}</TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">
                      {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={batchStage(batch)} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <BatchSheet batch={batch} />
                      {waiting && <RejectBatch batch={batch} />}
                      {waiting && <ApproveBatch batch={batch} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
