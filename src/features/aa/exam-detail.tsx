"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  FileCheck2,
  ImagePlus,
  Loader2,
  Save,
  Search,
  UserCheck,
  UserRound,
  UserX,
  Users,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Assessor, Batch, Course, Exam, Student } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { refId } from "@/lib/domain/refs";
import { examStage } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { matches } from "@/components/shared/search-input";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MarksDialog } from "./marks-dialog";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// "25-October-2026" (stored) to "2026-10-25" (date input)
function toInputDate(value?: string) {
  if (!value) return "";
  const date = new Date(value.replace(/-/g, " "));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ---------------------------------------------------------------- progress

function Journey({ exam, students }: { exam: Exam; students: Student[] }) {
  const pending = students.filter((student) => !student.absent && !student.markUploadStatus).length;
  const steps = [
    { label: "Assessor", done: Boolean(exam.AssessorId) },
    { label: "Date", done: Boolean(exam.assesmentdate) },
    { label: "Attendance", done: exam.presentStudents !== undefined && exam.presentStudents !== null },
    { label: "Marks", done: students.length > 0 && pending === 0 },
    { label: "Sheets submitted", done: Boolean(exam.markUploadAndExamCompleteStatus) },
    { label: "Certified", done: Boolean(exam.certificateIssued) },
  ];
  const current = steps.findIndex((step) => !step.done);
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, index) => (
        <li key={step.label} className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
              step.done && "border-success/30 bg-success/10 text-success",
              index === current && "border-primary bg-primary text-primary-foreground",
              !step.done && index !== current && "text-muted-foreground"
            )}
          >
            {step.done ? <Check className="size-3.5" strokeWidth={3} /> : <span className="tabular-nums">{index + 1}</span>}
            {step.label}
          </span>
          {index < steps.length - 1 && <span aria-hidden className={cn("h-px w-6", step.done ? "bg-success/50" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------- setup

function SetupCard({ exam, assessors, students, locked }: { exam: Exam; assessors: Assessor[]; students: Student[]; locked: boolean }) {
  const [assessorId, setAssessorId] = useState(refId(exam.AssessorId) ?? "");
  const [date, setDate] = useState(toInputDate(exam.assesmentdate));
  const presentByFlags = students.filter((student) => !student.absent).length;
  const [present, setPresent] = useState(String(exam.presentStudents ?? presentByFlags));

  const assign = useApiMutation((id: string) => api.put(`/exam/addassessor/${exam._id}`, { assessorId: id }), "Assessor assigned");
  const schedule = useApiMutation((value: string) => {
    const [year, month, day] = value.split("-");
    return api.put(`/exam/assesmentdate/${exam._id}`, { date: `${day}/${month}/${year}` });
  }, "Assessment date saved");
  const attendance = useApiMutation((value: number) => api.put(`/exam/attendance/${exam._id}`, { attendanceNumber: value }), "Attendance saved");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment setup</CardTitle>
        <CardDescription>Assign the assessor, fix the date and record how many candidates attended.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>Assessor</Label>
          <div className="flex gap-2">
            <Select value={assessorId} onValueChange={setAssessorId} disabled={locked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={assessors.length ? "Choose an assessor" : "Add assessors first"} />
              </SelectTrigger>
              <SelectContent>
                {assessors.map((assessor) => (
                  <SelectItem key={assessor._id} value={assessor._id}>
                    {assessor.name} · {assessor.assesoraId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              aria-label="Save assessor"
              disabled={locked || !assessorId || assessorId === refId(exam.AssessorId) || assign.isPending}
              onClick={() => assign.mutate(assessorId)}
            >
              {assign.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            </Button>
          </div>
          {assessors.length === 0 && (
            <Link href="/aa/assessors" className="text-xs text-primary hover:underline">
              Add an assessor
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-date">Assessment date</Label>
          <div className="flex gap-2">
            <Input id="exam-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={locked} />
            <Button
              variant="outline"
              size="icon"
              aria-label="Save date"
              disabled={locked || !date || date === toInputDate(exam.assesmentdate) || schedule.isPending}
              onClick={() => schedule.mutate(date)}
            >
              {schedule.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-present">Candidates present</Label>
          <div className="flex gap-2">
            <Input
              id="exam-present"
              type="number"
              min={0}
              max={exam.totalStudents ?? students.length}
              value={present}
              onChange={(event) => setPresent(event.target.value)}
              disabled={locked}
              className="tabular-nums"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Save attendance"
              disabled={locked || present === "" || attendance.isPending}
              onClick={() => attendance.mutate(Number(present))}
            >
              {attendance.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Out of {exam.totalStudents ?? students.length}. {presentByFlags} not marked absent.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- candidates

function MarkAbsent({ student }: { student: Student }) {
  const absent = useApiMutation(() => api.put(`/student/absent/${student._id}`), `${student.name} marked absent`);
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <UserX />
          Absent
        </Button>
      }
      title={`Mark ${student.name} absent?`}
      description="Absent candidates get no marks and no certificate. This cannot be undone."
      confirmLabel="Mark absent"
      destructive
      onConfirm={() => absent.mutateAsync(undefined)}
    />
  );
}

function CandidateStatus({ student }: { student: Student }) {
  if (student.absent) return <Badge variant="warning">Absent</Badge>;
  if (student.markUploadStatus) return <Badge variant="success">Grade {student.Grade}</Badge>;
  return <Badge variant="outline">Marks pending</Badge>;
}

// ---------------------------------------------------------------- photos & submission

function PhotosCard({ exam, locked }: { exam: Exam; locked: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append("photos", file));
    return api.put(`/exam/images/${exam._id}`, body);
  }, "Photos uploaded");
  const images = exam.images ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment photos</CardTitle>
        <CardDescription>Up to 10 photos from the assessment day. Uploading again replaces them.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded photo on S3 */}
                <img src={src} alt="" className="size-full object-cover transition-transform hover:scale-105" />
              </a>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No photos uploaded yet.</p>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []).slice(0, 10);
            if (files.length) upload.mutate(files);
            event.target.value = "";
          }}
        />
        {!locked && (
          <Button variant="outline" className="w-fit" disabled={upload.isPending} onClick={() => input.current?.click()}>
            {upload.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {images.length ? "Replace photos" : "Upload photos"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitResults({ exam, pending }: { exam: Exam; pending: number }) {
  const submit = useApiMutation((form: FormData) => api.put(`/exam/status/${exam._id}`, form), "Results submitted to the awarding body");
  return (
    <FormDialog
      trigger={
        <Button size="lg">
          <FileCheck2 />
          Submit results
        </Button>
      }
      title="Submit results"
      description="Upload the signed attendance and result sheets. The exam is then locked and the awarding body can publish certificates."
      submitLabel="Submit results"
      onSubmit={(form) => {
        if (pending > 0) {
          toast.error(`${pending} present candidate(s) still have no marks`);
          throw new Error("pending");
        }
        const body = new FormData();
        body.append("attendanceSheet", form.get("attendanceSheet") as File);
        body.append("resultSheet", form.get("resultSheet") as File);
        return submit.mutateAsync(body);
      }}
    >
      <Field label="Attendance sheet" name="attendanceSheet" type="file" accept=".pdf,image/*" required />
      <Field label="Result sheet" name="resultSheet" type="file" accept=".pdf,image/*" required />
    </FormDialog>
  );
}

// ---------------------------------------------------------------- page

export function ExamDetailPage({ id }: { id: string }) {
  const { data: exam, isLoading, isError } = useItem<Exam>(`/exam/${id}`);
  const aaId = refId(exam?.assesmentAgencyId);
  const assessors = useList<Assessor>(aaId ? `/assessor/aa/${aaId}` : null);
  const courses = useList<Course>("/course/course");
  const [search, setSearch] = useState("");

  if (isError || (!isLoading && !exam)) {
    return <EmptyState icon={Building2} title="Exam not found" description="It may not be assigned to your agency." />;
  }
  if (isLoading || !exam) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <LoadingRows rows={6} />
      </div>
    );
  }

  const batch = typeof exam.batchId === "object" ? (exam.batchId as Batch) : undefined;
  const students = (batch?.students ?? []).filter((student): student is Student => typeof student === "object");
  const course = (courses.data ?? []).find((item) => item.courseCode === exam.courseCode) ?? (courses.data ?? []).find((item) => item.courseName === exam.course);
  const locked = Boolean(exam.markUploadAndExamCompleteStatus);
  const absent = students.filter((student) => student.absent).length;
  const marked = students.filter((student) => student.markUploadStatus).length;
  const pending = students.length - absent - marked;
  const assessor = (assessors.data ?? []).find((item) => item._id === refId(exam.AssessorId));
  const shown = students.filter((student) => matches(search, student.name, student.MPR_Id, student.redg_No));

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
        <Link href="/aa/exams">
          <ArrowLeft />
          All exams
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{exam.course}</h1>
                <StageBadge stage={examStage(exam)} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-mono">{exam.batchABN}</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {exam.TrainingOrganization} · {exam.CenterName}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {exam.assesmentdate ?? "Date not set"}
                </span>
                <span>
                  {exam.scheme} · {exam.state}
                </span>
              </p>
            </div>
            {!locked && <SubmitResults exam={exam} pending={pending} />}
          </div>
          <Separator />
          <Journey exam={exam} students={students} />
        </CardContent>
      </Card>

      {!locked && exam.resultRejectionReason && (
        <Alert className="border-warning/30 bg-warning/5">
          <Undo2 className="text-warning" />
          <AlertTitle>Result sent back</AlertTitle>
          <AlertDescription>{exam.resultRejectionReason} Correct the marks if needed and submit the attendance and result sheets again.</AlertDescription>
        </Alert>
      )}

      {locked && (
        <Alert className="border-success/30 bg-success/5">
          <FileCheck2 className="text-success" />
          <AlertTitle>Results submitted</AlertTitle>
          <AlertDescription>
            <span className="flex flex-wrap gap-3">
              The exam is locked. <FileLink href={exam.attendanceSheet} label="Attendance sheet" />
              <FileLink href={exam.resultSheet} label="Result sheet" />
            </span>
          </AlertDescription>
        </Alert>
      )}

      <StatGrid>
        <StatCard label="Candidates" value={students.length} hint={`${exam.presentStudents ?? "—"} recorded present`} icon={Users} />
        <StatCard label="Marks uploaded" value={`${marked}/${students.length - absent}`} hint={pending ? `${pending} pending` : "All done"} icon={UserCheck} tone={pending ? "warning" : "success"} />
        <StatCard label="Absent" value={absent} hint="No marks, no certificate" icon={UserX} tone="info" />
        <StatCard label="Assessor" value={assessor ? "Assigned" : "—"} hint={assessor ? `${assessor.name} · ${assessor.phoneNumber}` : "Not assigned yet"} icon={UserRound} tone={assessor ? "success" : "warning"} />
      </StatGrid>

      <SetupCard key={`${refId(exam.AssessorId)}-${exam.assesmentdate}-${exam.presentStudents}`} exam={exam} assessors={assessors.data ?? []} students={students} locked={locked} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidates</CardTitle>
          <CardDescription>
            Enter marks NOS by NOS for each candidate who attended{course ? ` (${course.Nos?.length ?? 0} NOS in ${course.courseName})` : ""}, or mark them absent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {students.length > 0 && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or MPR…" className="pl-8" />
            </div>
          )}
          {students.length === 0 ? (
            <EmptyState icon={Users} title="No candidates in this batch" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead className="hidden sm:table-cell">MPR ID</TableHead>
                  <TableHead className="hidden md:table-cell">Date of birth</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 rounded-lg">
                          {student.profilepic && <AvatarImage src={student.profilepic} alt="" className="rounded-lg object-cover" />}
                          <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">{initials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">Reg. {student.redg_No}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{student.MPR_Id}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell>
                      <CandidateStatus student={student} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {!locked && !student.absent && !student.markUploadStatus && (
                        <>
                          <MarkAbsent student={student} />
                          <MarksDialog exam={exam} student={student} course={course} />
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PhotosCard exam={exam} locked={locked} />
    </div>
  );
}
