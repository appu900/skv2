"use client";

import { useState } from "react";
import { CalendarCheck, FileText, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AssessmentAgency, Batch, Exam } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { examStage } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { SelectField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function AssignExamDialog() {
  const batches = useList<Batch>("/batch");
  const agencies = useList<AssessmentAgency>("/aa/status/approved");
  const [batchId, setBatchId] = useState("");
  const eligible = (batches.data ?? []).filter((batch) => batch.paymentStatus && !batch.isAssigned);
  const selected = eligible.find((batch) => batch._id === batchId);

  const assign = useApiMutation(
    (body: { batchId: string; assesmentAgencyId: string; courseName?: string }) => api.post("/exam/create", body),
    "Exam assigned"
  );

  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          Assign exam
        </Button>
      }
      title="Assign an exam"
      description="Only submitted batches with a confirmed payment that have no exam yet are listed."
      submitLabel="Assign"
      onSubmit={(form) =>
        assign.mutateAsync({
          batchId: String(form.get("batchId")),
          assesmentAgencyId: String(form.get("assesmentAgencyId")),
          courseName: selected?.courseName,
        })
      }
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
      <SelectField
        label="Assessment agency"
        name="assesmentAgencyId"
        required
        placeholder="Select an approved agency"
        options={(agencies.data ?? []).map((aa) => ({ value: aa._id, label: aa.agencyName }))}
      />
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
              ["Agency paid", exam.paymentStatus ? "Yes" : "No"],
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
  const markPaid = useApiMutation((id: string) => api.put(`/exam/paymentstatus/${id}`), "Marked as paid");

  const rows = data.filter((exam) =>
    matches(search, exam.batchABN, exam.course, exam.TrainingOrganization, exam.assesmentAgency)
  );

  return (
    <>
      <PageHeader title="Exams" description="Assign paid batches to assessment agencies and follow progress." actions={<AssignExamDialog />} />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search ABN, course, partner, agency…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No exams yet" description="Assign a paid batch to an agency to create one." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Agency</TableHead>
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
                  <TableCell className="hidden md:table-cell">{exam.assesmentAgency}</TableCell>
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
                      {exam.paymentStatus ? (
                        <Badge variant="success" className="self-center">
                          Agency paid
                        </Badge>
                      ) : (
                        exam.markUploadAndExamCompleteStatus && (
                          <ConfirmDialog
                            trigger={
                              <Button variant="outline" size="sm">
                                Mark paid
                              </Button>
                            }
                            title="Mark the agency as paid for this exam?"
                            description="Usually this happens automatically when the monthly invoice is paid."
                            confirmLabel="Mark paid"
                            onConfirm={() => markPaid.mutateAsync(exam._id)}
                          />
                        )
                      )}
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
