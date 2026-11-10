"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import type { Exam } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { FileLink } from "@/components/shared/file-link";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { ApproveResult, RejectResult } from "@/components/shared/result-review";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CertificateStatus, ResultsSheet } from "@/features/admin/certificates";

type Tab = "review" | "published" | "all";

const inReview = (exam: Exam) => exam.status === "completed" && !exam.certificateIssued;

// Results of corporate batches: check the sheets and marks, then approve (certificates are generated) or send back.
export function LcrcResultsPage() {
  const [tab, setTab] = useState<Tab>("review");
  const [search, setSearch] = useState("");
  const exams = useList<Exam>("/lcrc/results", {
    // keep polling while certificates are being generated so the status updates by itself
    refetchInterval: (query) =>
      query.state.data?.some((exam) => ["queued", "processing"].includes(exam.certificateStatus ?? "")) ? 3000 : false,
  });

  const data = exams.data ?? [];
  const review = data.filter(inReview);
  const published = data.filter((exam) => exam.certificateIssued);
  const rows = { review, published, all: data }[tab].filter((exam) => matches(search, exam.batchABN, exam.course, exam.TrainingOrganization, exam.assesmentAgency));

  return (
    <>
      <PageHeader title="Results" description="Results of corporate batches. Approving a result generates the certificates; sending it back asks the agency to upload it again." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "review", label: "To review", count: review.length },
                { value: "published", label: "Published", count: published.length },
                { value: "all", label: "All", count: data.length },
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
          <EmptyState icon={Award} title={tab === "review" ? "Nothing to review" : "No results"} description="Results appear here once the agency uploads the sheets." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Agency</TableHead>
                <TableHead className="hidden sm:table-cell">Present</TableHead>
                <TableHead className="hidden lg:table-cell">Sheets</TableHead>
                <TableHead>Certificates</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((exam) => (
                <TableRow key={exam._id}>
                  <TableCell>
                    <p className="font-medium">{exam.course}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.batchABN} · {exam.TrainingOrganization}
                    </p>
                    {exam.assesmentdate && <p className="text-xs text-muted-foreground">Assessed {formatDate(exam.assesmentdate)}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{exam.assesmentAgency}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {exam.presentStudents ?? "—"}/{exam.totalStudents ?? 0}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      <FileLink href={exam.attendanceSheet} label="Attendance" />
                      <FileLink href={exam.resultSheet} label="Result" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <CertificateStatus exam={exam} />
                    {exam.resultRejectionReason && !inReview(exam) && (
                      <p className="mt-1 max-w-56 text-xs text-muted-foreground">Sent back: {exam.resultRejectionReason}</p>
                    )}
                    {exam.certificateError && <p className="mt-1 text-xs text-muted-foreground">{exam.certificateError}</p>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <ResultsSheet exam={exam} />
                    {inReview(exam) && <RejectResult exam={exam} />}
                    {inReview(exam) && <ApproveResult exam={exam} />}
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
