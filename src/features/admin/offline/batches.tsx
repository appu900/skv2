"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileStack, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { OfflineBatch, OfflineTp } from "@/lib/api/offline";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BatchFields, batchPayload, componentDraft } from "./batch-form";

export const BATCH_STATUS: Record<OfflineBatch["status"], [string, "outline" | "info" | "success"]> = {
  draft: ["Marks pending", "outline"],
  assessed: ["Ready to publish", "info"],
  published: ["Published", "success"],
};

function CreateBatch() {
  const router = useRouter();
  const [components, setComponents] = useState(componentDraft());
  const create = useApiMutation((body: Record<string, unknown>) => api.post<{ data: OfflineBatch }>("/offline/admin/batches", body), "Batch created");
  return (
    <FormDialog
      wide
      trigger={
        <Button>
          <Plus />
          New batch
        </Button>
      }
      title="New batch for an offline partner"
      description="Enter the batch the partner sent you. Candidates, marks and documents come next."
      submitLabel="Create batch"
      onSubmit={async (form) => {
        const response = await create.mutateAsync(batchPayload(form, components));
        router.push(`/admin/offline/batches/${response.data.data._id}`);
      }}
    >
      <BatchFields components={components} setComponents={setComponents} />
    </FormDialog>
  );
}

export function OfflineBatchesPage() {
  const router = useRouter();
  const tpFilter = useSearchParams().get("tp") ?? "all";
  const [search, setSearch] = useState("");
  const tps = useList<OfflineTp>("/offline/admin/tps");
  const { data = [], isLoading } = useList<OfflineBatch>(`/offline/admin/batches${tpFilter !== "all" ? `?tp=${tpFilter}` : ""}`);
  const tpName = (batch: OfflineBatch) => (typeof batch.tp === "object" ? batch.tp.organizationName : "");
  const rows = data.filter((batch) => matches(search, batch.batchCode, batch.jobRole, tpName(batch), batch.externalBatchId ?? "", batch.scheme ?? ""));
  return (
    <>
      <PageHeader title="Offline batches" description="Batches of offline partners. CUTM enters the candidates, records the assessment and issues the documents in each partner's format." actions={<CreateBatch />} />
      <ListCard
        toolbar={
          <>
            <Select value={tpFilter} onValueChange={(value) => router.replace(value === "all" ? "/admin/offline/batches" : `/admin/offline/batches?tp=${value}`)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All partners</SelectItem>
                {(tps.data ?? []).map((tp) => (
                  <SelectItem key={tp._id} value={tp._id}>
                    {tp.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search batch, job role, scheme…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={FileStack} title="No batches" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Scheme</TableHead>
                <TableHead className="hidden sm:table-cell">Assessment</TableHead>
                <TableHead className="text-right">Candidates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <p className="font-medium">{batch.jobRole}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.batchCode}
                      {batch.externalBatchId ? ` · ${batch.externalBatchId}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tpName(batch)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{batch.scheme ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(batch.assessmentDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {batch.candidates ?? 0}
                    {batch.status !== "draft" && <span className="text-xs text-muted-foreground"> ({batch.passed} passed)</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BATCH_STATUS[batch.status][1]}>{BATCH_STATUS[batch.status][0]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/offline/batches/${batch._id}`}>Open</Link>
                    </Button>
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
