"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck, FileText, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Batch, Exam } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { examStage } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { SelectField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// No assessment agency in AMASY (client, 2026-11-24): CUTM conducts every assessment itself.
function StartAssessmentDialog() {
  const batches = useList<Batch>("/batch");
  const [batchId, setBatchId] = useState("");
  const eligible = (batches.data ?? []).filter((batch) => batch.paymentStatus && !batch.isAssigned);
  const selected = eligible.find((batch) => batch._id === batchId);

  const start = useApiMutation((body: { batchId: string; courseName?: string }) => api.post("/exam/create", body), "Assessment opened");

  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          Start assessment
        </Button>
      }
      title="Start an assessment"
      description="CUTM conducts the assessment. Only submitted batches with a confirmed payment that have no assessment yet are listed."
      submitLabel="Start assessment"
      onSubmit={(form) => start.mutateAsync({ batchId: String(form.get("batchId")), courseName: selected?.courseName })}
    >
      <SelectField
        label="Batch"
        name="batchId"
        required
        value={batchId}
        onValueChange={setBatchId}
        placeholder={eligible.length ? "Select a paid batch" : "No batches are ready"}
        options={eligible.map((batch) => ({
          value: batch._id,
          label: `${batch.ABN_Number} · ${batch.courseName} · ${batch.trainingOrganization}`,
        }))}
      />
      {selected && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <DetailList
            items={[
              ["Course", selected.courseName],
              ["Candidates", selected.students.length],
              ["Centre", selected.centerName],
              ["State", selected.state],
            ]}
          />
        </div>
      )}
    </FormDialog>
  );
}

function ExamDocuments({ exam }: { exam: Exam }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText />
          Details
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{exam.batchABN}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <StageBadge stage={examStage(exam)} />
            <span>{exam.assesmentAgency}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <DetailList
            items={[
              ["Course", exam.course],
              ["Training partner", exam.TrainingOrganization],
              ["Centre", exam.CenterName],
              ["Scheme", exam.scheme],
              ["Assessment date", exam.assesmentdate || "Not scheduled"],
              ["Candidates", `${exam.presentStudents ?? "—"} present of ${exam.totalStudents ?? 0}`],
              ["Assessor", exam.cutmAssessorName || "Not assigned"],
              ["Certificates", exam.certificateIssued ? `${exam.certificatesIssuedCount ?? 0} issued` : "Not published"],
            ]}
          />
          <div className="flex flex-wrap gap-4">
            <FileLink href={exam.attendanceSheet} label="Attendance sheet" />
            <FileLink href={exam.resultSheet} label="Result sheet" />
          </div>
          {exam.images && exam.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {exam.images.map((image) => (
                <a key={image} href={image} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote S3 images of unknown size */}
                  <img src={image} alt="Assessment photo" className="aspect-square w-full rounded-md object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ExamsPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<Exam>("/exam/all");

  const rows = data.filter((exam) =>
    matches(search, exam.batchABN, exam.course, exam.TrainingOrganization, exam.assesmentAgency)
  );

  return (
    <>
      <PageHeader title="Assessments" description="CUTM assesses every paid batch: assign a CUTM assessor, record attendance and marks, then publish." actions={<StartAssessmentDialog />} />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search ABN, course, partner…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No assessments yet" description="Start one for a paid batch." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Assessor</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Present</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{exam.cutmAssessorName || <span className="text-muted-foreground">Not assigned</span>}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{exam.assesmentdate || "Not set"}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {exam.presentStudents ?? "—"}/{exam.totalStudents ?? 0}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={examStage(exam)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <ExamDocuments exam={exam} />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/exams/${exam._id}`}>{exam.markUploadAndExamCompleteStatus ? "Open" : "Conduct"}</Link>
                      </Button>
                    </div>
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
