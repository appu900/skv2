"use client";

import { useRef, useState } from "react";
import { Camera, CircleCheck, CircleDashed, Loader2, Send, Settings2, Undo2, UserPlus, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Batch, Student, Trainer } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { approverOf, batchStage, formatCurrency, formatDate } from "@/lib/domain/stages";
import { STATES } from "@/lib/domain/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { CheckboxGroup, Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GENDERS = ["Male", "Female", "Transgender"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"];

const daysBetween = (start?: string, end?: string) =>
  start && end ? Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1) : 0;

export function PhotoUpload({ student }: { student: Student }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((file: File) => {
    const body = new FormData();
    body.append("image", file);
    return api.put(`/student/profile/${student._id}`, body);
  }, `Photo saved for ${student.name}`);

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = "";
        }}
      />
      <Button variant={student.profilepic ? "ghost" : "outline"} size="sm" disabled={upload.isPending} onClick={() => input.current?.click()}>
        {upload.isPending ? <Loader2 className="animate-spin" /> : <Camera />}
        {student.profilepic ? "Change" : "Add photo"}
      </Button>
    </>
  );
}

export function AddCandidateDialog({ batch }: { batch: Batch }) {
  const add = useApiMutation(async ({ body, photo }: { body: Record<string, unknown>; photo?: File }) => {
    const response = await api.post<{ data: Student }>(`/batch/addstudent/${batch._id}`, body);
    if (photo) {
      const form = new FormData();
      form.append("image", photo);
      await api.put(`/student/profile/${response.data.data._id}`, form);
    }
    return response;
  }, "Candidate added");

  return (
    <FormDialog
      wide
      trigger={
        <Button size="sm">
          <UserPlus />
          Add candidate
        </Button>
      }
      title="Add a candidate"
      description={`${batch.courseName} · ${batch.centerName}. Course, centre and training dates are taken from the batch.`}
      submitLabel="Add candidate"
      onSubmit={async (form) => {
        const text = (key: string) => String(form.get(key) ?? "").trim();
        const photo = form.get("photo");
        await add.mutateAsync({
          photo: photo instanceof File && photo.size > 0 ? photo : undefined,
          body: {
            name: text("name"),
            MPR_Id: text("MPR_Id"),
            SNA_Id: text("SNA_Id"),
            uid: text("uid"),
            fathername: text("fathername"),
            mothername: text("mothername"),
            dob: text("dob"),
            gender: text("gender"),
            religion: text("religion"),
            category: text("category"),
            nationality: text("nationality"),
            generalqualification: text("generalqualification"),
            mobile: text("mobile"),
            email: text("email"),
            address: text("address"),
            city: text("city"),
            district: text("district"),
            state: text("state"),
            pincode: text("pincode"),
            module: text("module"),
            sector_name: batch.sectorName,
            course: batch.courseName,
            cenid: batch.CenterCode,
            traininstartdate: batch.startDate,
            trainingenddate: batch.endDate,
            trainingHours: Number(form.get("trainingHours")),
            totalhours: batch.courseDuration,
            totaldays: daysBetween(batch.startDate, batch.endDate),
          },
        });
      }}
    >
      <p className="text-sm font-semibold">Identity</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="MPR ID" name="MPR_Id" required hint="Must be unique across the platform" />
        <Field label="SNA ID" name="SNA_Id" required />
        <Field label="Aadhaar / UID" name="uid" required />
        <Field label="Father's name" name="fathername" required />
        <Field label="Mother's name" name="mothername" required />
        <Field label="Date of birth" name="dob" type="date" required />
        <SelectField label="Gender" name="gender" required options={GENDERS} />
        <SelectField label="Category" name="category" required options={CATEGORIES} />
        <SelectField label="Religion" name="religion" required options={RELIGIONS} />
        <Field label="Nationality" name="nationality" required defaultValue="Indian" />
        <Field label="Highest qualification" name="generalqualification" required />
      </div>
      <Separator />
      <p className="text-sm font-semibold">Contact</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile" name="mobile" type="tel" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Address" name="address" required className="sm:col-span-2" />
        <Field label="City" name="city" required />
        <Field label="District" name="district" required />
        <SelectField label="State" name="state" required options={STATES} defaultValue={batch.state} />
        <Field label="PIN code" name="pincode" required inputMode="numeric" />
      </div>
      <Separator />
      <p className="text-sm font-semibold">Training</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Module" name="module" required defaultValue={batch.courseName} />
        <Field label="Training hours attended" name="trainingHours" type="number" min={0} required defaultValue={batch.courseDuration} />
        <Field label="Photo" name="photo" type="file" accept="image/*" hint="Required before the batch can be submitted" className="sm:col-span-2" />
      </div>
    </FormDialog>
  );
}

export function AddTrainersDialog({ batch, current }: { batch: Batch; current: Trainer[] }) {
  const trainers = useList<Trainer>(batch.trainingOrganizationId ? `/trainer/tp/${batch.trainingOrganizationId}` : null);
  const add = useApiMutation((trainerIds: string[]) => api.post(`/batch/bulkaddTrainer/${batch._id}`, { trainerIds }), "Trainers added");
  const taken = new Set(current.map((trainer) => trainer._id));
  const available = (trainers.data ?? []).filter((trainer) => !taken.has(trainer._id));

  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <UserPlus />
          Add trainers
        </Button>
      }
      title="Add trainers to this batch"
      description="Pick from your trainers. New trainers are created on the Trainers page."
      submitLabel="Add selected"
      onSubmit={async (form) => {
        const ids = form.getAll("trainerIds").map(String);
        if (ids.length === 0) {
          toast.error("Pick at least one trainer");
          throw new Error("none");
        }
        await add.mutateAsync(ids);
      }}
    >
      <CheckboxGroup
        label="Trainers"
        name="trainerIds"
        options={available.map((trainer) => ({
          value: trainer._id,
          label: trainer.name,
          description: [trainer.coursecode, trainer.sector].filter(Boolean).join(" · "),
        }))}
        emptyText={trainers.isLoading ? "Loading…" : "All your trainers are already in this batch"}
      />
    </FormDialog>
  );
}

// Shown on a draft the SNA / LC/RC sent back: why, and that it can be resubmitted after fixing.
export function ReturnedNotice({ batch }: { batch: Batch }) {
  if (batch.batchActivePermission || !batch.rejectedByGovernmentBody) return null;
  return (
    <Alert className="border-warning/30 bg-warning/5">
      <Undo2 className="text-warning" />
      <AlertTitle>Returned by the {approverOf(batch.schemeType)}</AlertTitle>
      <AlertDescription>{batch.governmentRejectionReason || "No reason given."} Fix the batch and submit it again.</AlertDescription>
    </Alert>
  );
}

export function SubmitChecklist({ batch, students, trainers }: { batch: Batch; students: Student[]; trainers: Trainer[] }) {
  const submit = useApiMutation(() => api.put(`/batch/active/${batch._id}`), "Batch submitted");
  const missingPhotos = students.filter((student) => !student.profilepic).length;
  const checks = [
    { done: students.length > 0, label: students.length > 0 ? `${students.length} candidate(s) added` : "Add at least one candidate" },
    { done: students.length > 0 && missingPhotos === 0, label: missingPhotos ? `${missingPhotos} candidate(s) without a photo` : "Every candidate has a photo" },
    { done: trainers.length > 0, label: trainers.length > 0 ? `${trainers.length} trainer(s) added` : "Add at least one trainer" },
  ];
  const ready = checks.every((check) => check.done);

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-semibold">Ready to submit?</p>
      <ul className="mt-3 flex flex-col gap-2">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2 text-sm">
            {check.done ? <CircleCheck className="size-4 text-success" /> : <CircleDashed className="size-4 text-muted-foreground" />}
            <span className={check.done ? "" : "text-muted-foreground"}>{check.label}</span>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        trigger={
          <Button className="mt-4 w-full" disabled={!ready}>
            <Send />
            Submit batch
          </Button>
        }
        title="Submit this batch?"
        description={`Candidates can no longer be added. The batch goes to the ${approverOf(batch.schemeType)} for approval, then you upload the payment proof.`}
        confirmLabel="Submit"
        onConfirm={() => submit.mutateAsync(undefined)}
      />
    </div>
  );
}

function ManageContent({ id }: { id: string }) {
  const { data: batch, isLoading } = useItem<Batch>(`/batch/${id}`);
  if (isLoading || !batch) return <LoadingRows rows={8} />;

  const students = batch.students.filter((student): student is Student => typeof student === "object");
  const trainers = (batch.trainers ?? []).filter((trainer): trainer is Trainer => typeof trainer === "object");
  const draft = !batch.batchActivePermission;

  return (
    <Tabs defaultValue={draft ? "candidates" : "overview"}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="candidates">
          Candidates <Badge variant="secondary">{students.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="trainers">
          Trainers <Badge variant="secondary">{trainers.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
        <ReturnedNotice batch={batch} />
        {draft && <SubmitChecklist batch={batch} students={students} trainers={trainers} />}
        <DetailList
          items={[
            ["ABN", batch.ABN_Number],
            ["Course", `${batch.courseName}${batch.courseCode ? ` (${batch.courseCode})` : ""}`],
            ["Sector", batch.sectorName],
            ["Duration", batch.courseDuration ? `${batch.courseDuration} hours` : null],
            ["Centre", `${batch.centerName}${batch.CenterCode ? ` (${batch.CenterCode})` : ""}`],
            ["Scheme", `${batch.scheme} · ${batch.schemeType}`],
            ["State", batch.state],
            ["Training period", `${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}`],
            ["Amount payable", batch.amountToPaid ? formatCurrency(batch.amountToPaid) : null],
            ["Assessor", batch.assessorName],
          ]}
        />
      </TabsContent>

      <TabsContent value="candidates" className="mt-4 flex flex-col gap-4">
        {draft && (
          <div className="flex justify-end">
            <AddCandidateDialog batch={batch} />
          </div>
        )}
        {students.length === 0 ? (
          <EmptyState icon={Users} title="No candidates yet" description="Add candidates one by one, each with a photo." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead className="hidden sm:table-cell">MPR ID</TableHead>
                <TableHead className="text-right">{draft ? "Photo" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {student.profilepic && <AvatarImage src={student.profilepic} alt="" />}
                        <AvatarFallback className="text-xs">{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.redg_No}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{student.MPR_Id}</TableCell>
                  <TableCell className="text-right">
                    {draft ? (
                      <PhotoUpload student={student} />
                    ) : student.absent ? (
                      <Badge variant="warning">Absent</Badge>
                    ) : student.Grade ? (
                      <Badge variant="success">Grade {student.Grade}</Badge>
                    ) : (
                      <Badge variant="outline">Enrolled</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="trainers" className="mt-4 flex flex-col gap-4">
        {!batch.certificateIssued && (
          <div className="flex justify-end">
            <AddTrainersDialog batch={batch} current={trainers} />
          </div>
        )}
        {trainers.length === 0 ? (
          <EmptyState icon={UserRound} title="No trainers yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-right">Course</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((trainer) => (
                <TableRow key={trainer._id}>
                  <TableCell>
                    <p className="font-medium">{trainer.name}</p>
                    <p className="text-xs text-muted-foreground">{trainer.email}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{trainer.phoneNumber}</TableCell>
                  <TableCell className="text-right">{trainer.coursecode}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Slide-over where a training partner fills and submits one batch; data loads when it opens.
export function BatchManageSheet({ batch }: { batch: Batch }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={batch.batchActivePermission ? "ghost" : "outline"} size="sm">
          <Settings2 />
          {batch.batchActivePermission ? "View" : "Manage"}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{batch.ABN_Number || batch.courseName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <StageBadge stage={batchStage(batch)} />
            <span>
              {batch.courseName} · {batch.centerName}
            </span>
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-6">{open && <ManageContent id={batch._id} />}</div>
      </SheetContent>
    </Sheet>
  );
}

