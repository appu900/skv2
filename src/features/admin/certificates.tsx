"use client";

import { useState } from "react";
import { Award, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Exam } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { refId } from "@/lib/domain/refs";
import { PageHeader } from "@/components/portal/page-header";
import { BatchResults } from "@/components/shared/batch-results";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RejectResult } from "@/components/shared/result-review";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = "ready" | "published" | "all";

export function CertificateStatus({ exam }: { exam: Exam }) {
  if (exam.certificateIssued) return <Badge variant="success">{exam.certificatesIssuedCount ?? 0} issued</Badge>;
  if (exam.certificateStatus === "queued" || exam.certificateStatus === "processing") {
    return (
      <Badge variant="info">
        <Loader2 className="animate-spin" />
        {exam.certificateStatus === "queued" ? "Queued" : "Generating"}
      </Badge>
    );
  }
  if (exam.certificateStatus === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (exam.markUploadAndExamCompleteStatus) return <Badge variant="warning">Ready</Badge>;
  return <Badge variant="outline">Results pending</Badge>;
}

export function ResultsSheet({ exam }: { exam: Exam }) {
  const batchId = refId(exam.batchId);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          Results
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{exam.batchABN}</SheetTitle>
          <SheetDescription>
            {exam.course} · {exam.TrainingOrganization}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-6">
          <BatchResults batchId={open && batchId ? batchId : null} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CertificatesPage() {
  const [tab, setTab] = useState<Tab>("ready");
  const [search, setSearch] = useState("");
  const exams = useList<Exam>("/exam/all", {
    // keep polling while a generation job is running so the status updates by itself
    refetchInterval: (query) =>
      query.state.data?.some((exam) => ["queued", "processing"].includes(exam.certificateStatus ?? ""))
        ? 3000
        : false,
  });
  const publish = useApiMutation(
    (id: string) => api.post(`/certificate/publish/exam/${id}`),
    "Certificate generation started"
  );

  const data = exams.data ?? [];
  const ready = data.filter((exam) => exam.markUploadAndExamCompleteStatus && !exam.certificateIssued);
  const published = data.filter((exam) => exam.certificateIssued);
  const source = { ready, published, all: data }[tab];
  const rows = source.filter((exam) => matches(search, exam.batchABN, exam.course, exam.TrainingOrganization));

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Publish certificates for completed assessments. Only present candidates who passed receive one."
      />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "ready", label: "Ready to publish", count: ready.length },
                { value: "published", label: "Published", count: published.length },
                { value: "all", label: "All exams", count: data.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, course, partner…" />
            </div>
          </>
        }
      >
        {exams.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Award} title={tab === "ready" ? "Nothing ready to publish" : "No exams"} description="Exams appear here once the agency submits results." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Agency</TableHead>
                <TableHead className="hidden sm:table-cell">Present</TableHead>
                <TableHead>Certificates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((exam) => {
                const running = exam.certificateStatus === "queued" || exam.certificateStatus === "processing";
                return (
                  <TableRow key={exam._id}>
                    <TableCell>
                      <p className="font-medium">{exam.course}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.batchABN} · {exam.TrainingOrganization}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{exam.assesmentAgency}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {exam.presentStudents ?? "—"}/{exam.totalStudents ?? 0}
                    </TableCell>
                    <TableCell>
                      <CertificateStatus exam={exam} />
                      {exam.certificateError && (
                        <p className="mt-1 text-xs text-muted-foreground">{exam.certificateError}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ResultsSheet exam={exam} />
                        {exam.markUploadAndExamCompleteStatus && !exam.certificateIssued && <RejectResult exam={exam} />}
                        {exam.markUploadAndExamCompleteStatus && !exam.certificateIssued && (
                          <ConfirmDialog
                            trigger={
                              <Button size="sm" disabled={running}>
                                <Send />
                                {exam.certificateStatus === "failed" ? "Retry" : "Publish"}
                              </Button>
                            }
                            title="Publish certificates?"
                            description="Certificates are generated in the background for every present candidate who passed. The batch is then marked as completed."
                            confirmLabel="Publish"
                            onConfirm={() => publish.mutateAsync(exam._id)}
                          />
                        )}
                      </div>
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
