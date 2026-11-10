"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ToaBatch } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BatchFields, batchPayload } from "./batch-form";
import { BatchStatusBadge } from "./labels";

function CreateBatchDialog() {
  const router = useRouter();
  const create = useApiMutation((body: Record<string, unknown>) => api.post<{ data: ToaBatch }>("/toa/tp/batches", body), "Batch created");
  return (
    <FormDialog
      wide
      trigger={
        <Button>
          <Plus />
          New batch
        </Button>
      }
      title="Create a batch"
      description="Then add approved assessors and the session plan, and submit it to CUTM."
      submitLabel="Create batch"
      onSubmit={async (form) => {
        const response = await create.mutateAsync(batchPayload(form));
        router.push(`/toa/batches/${response.data.data._id}`);
      }}
    >
      <BatchFields />
    </FormDialog>
  );
}

export function ToaBatchesPage({ basePath = "/toa/batches" }: { basePath?: string }) {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaBatch>("/toa/tp/batches");
  const rows = data.filter((batch) => matches(search, batch.batchCode, batch.programmeName, batch.trainerName));
  return (
    <>
      <PageHeader title="Batches" description="Form a batch from approved assessors, submit it to CUTM, then record attendance session by session." actions={<CreateBatchDialog />} />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search batch, programme, trainer…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Layers} title="No batches yet" description="Create a batch once CUTM has approved some of your assessors." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Dates</TableHead>
                <TableHead className="hidden sm:table-cell">Assessors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <p className="font-medium">{batch.programmeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.batchCode} · {batch.trainingMode}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {batch.trainees.length}/{batch.capacity}
                  </TableCell>
                  <TableCell>
                    <BatchStatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`${basePath}/${batch._id}`}>Open</Link>
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
