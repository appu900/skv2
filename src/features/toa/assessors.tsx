"use client";

import { useState } from "react";
import { FileUp, Pencil, Plus, Send, Trash2, UserRound, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { openPrivateFile } from "@/lib/api/download";
import type { ToaTrainee, TraineeStatus } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TraineeStatusBadge } from "./labels";

type Tab = "all" | "draft" | "pending" | "correction_required" | "approved" | "rejected";
const EDITABLE: TraineeStatus[] = ["draft", "correction_required"];
const DOCUMENTS = [
  { name: "photo", label: "Photograph", accept: "image/jpeg,image/png", required: true },
  { name: "idProof", label: "Identity proof", accept: "image/jpeg,image/png,application/pdf", required: true },
  { name: "qualificationCertificate", label: "Qualification certificate", accept: "image/jpeg,image/png,application/pdf", required: true },
  { name: "experienceProof", label: "Experience proof", accept: "image/jpeg,image/png,application/pdf", required: false },
] as const;
const FIELDS = ["name", "email", "mobile", "dob", "gender", "qualification", "experienceYears", "sector", "currentOrganisation", "designation", "address", "state", "idProofType", "idProofNumber"];

const payload = (form: FormData) => Object.fromEntries(FIELDS.map((field) => [field, form.get(field)]).filter(([, value]) => value !== null && value !== ""));

function TraineeFields({ trainee }: { trainee?: ToaTrainee }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name="name" required defaultValue={trainee?.name} className="sm:col-span-2" />
      <Field label="Email" name="email" type="email" required defaultValue={trainee?.email} />
      <Field label="Mobile" name="mobile" required pattern="[6-9][0-9]{9}" title="10 digit mobile number" defaultValue={trainee?.mobile} />
      <Field label="Date of birth" name="dob" type="date" defaultValue={trainee?.dob?.slice(0, 10)} />
      <SelectField label="Gender" name="gender" options={["Female", "Male", "Other"]} defaultValue={trainee?.gender} />
      <Field label="Highest qualification" name="qualification" defaultValue={trainee?.qualification} />
      <Field label="Experience (years)" name="experienceYears" type="number" min={0} max={60} step="0.5" defaultValue={trainee?.experienceYears} />
      <Field label="Sector / domain" name="sector" defaultValue={trainee?.sector} placeholder="e.g. Railways – Signalling" />
      <Field label="Current organisation" name="currentOrganisation" defaultValue={trainee?.currentOrganisation} />
      <Field label="Designation" name="designation" defaultValue={trainee?.designation} />
      <SelectField label="State" name="state" options={STATES} defaultValue={trainee?.state} />
      <Field label="Address" name="address" defaultValue={trainee?.address} className="sm:col-span-2" />
      <SelectField label="ID proof" name="idProofType" options={["Aadhaar", "PAN", "Passport", "Voter ID", "Driving Licence"]} defaultValue={trainee?.idProofType} />
      <Field label="ID proof number" name="idProofNumber" hint={trainee?.idProofNumber ? `Saved: ${trainee.idProofNumber}. Leave blank to keep it.` : undefined} />
    </div>
  );
}

function CreateTraineeDialog() {
  const create = useApiMutation((body: Record<string, unknown>) => api.post("/toa/tp/assessors", body), "Draft saved; add documents and submit it");
  return (
    <FormDialog
      wide
      trigger={
        <Button>
          <Plus />
          Register assessor
        </Button>
      }
      title="Register an assessor"
      description="Save a draft with what you have; mandatory fields and documents are checked when you submit to CUTM."
      submitLabel="Save draft"
      onSubmit={(form) => create.mutateAsync(payload(form))}
    >
      <TraineeFields />
    </FormDialog>
  );
}

function EditTraineeDialog({ trainee }: { trainee: ToaTrainee }) {
  const update = useApiMutation((body: Record<string, unknown>) => api.put(`/toa/tp/assessors/${trainee._id}`, body), "Saved");
  return (
    <FormDialog
      wide
      trigger={
        <Button variant="outline" size="sm">
          <Pencil />
          Edit details
        </Button>
      }
      title={`Edit ${trainee.name}`}
      onSubmit={(form) => update.mutateAsync(payload(form))}
    >
      <TraineeFields trainee={trainee} />
    </FormDialog>
  );
}

function DocumentsForm({ trainee }: { trainee: ToaTrainee }) {
  const upload = useApiMutation((form: FormData) => api.put(`/toa/tp/assessors/${trainee._id}/documents`, form), "Documents uploaded");
  const editable = EDITABLE.includes(trainee.status);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        for (const doc of DOCUMENTS) if (!(form.get(doc.name) as File | null)?.size) form.delete(doc.name);
        await upload.mutateAsync(form).catch(() => {});
        formElement.reset();
      }}
    >
      {DOCUMENTS.map((doc) => {
        const key = trainee.documents?.[doc.name];
        return (
          <div key={doc.name} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <Label className="text-sm">
                {doc.label}
                {doc.required && <span className="text-destructive">*</span>}
              </Label>
              {key ? (
                <button type="button" className="mt-1 text-xs text-primary underline-offset-4 hover:underline" onClick={() => openPrivateFile("/toa/tp/files", key)}>
                  Open uploaded file
                </button>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Not uploaded</p>
              )}
            </div>
            {editable && <Input type="file" name={doc.name} accept={doc.accept} className="sm:w-60" />}
          </div>
        );
      })}
      {editable && (
        <Button type="submit" variant="outline" disabled={upload.isPending} className="self-start">
          <FileUp />
          Upload selected files
        </Button>
      )}
      <p className="text-xs text-muted-foreground">JPG, PNG or PDF. Files are stored privately and only CUTM and your organisation can open them.</p>
    </form>
  );
}

function TraineeSheet({ trainee }: { trainee: ToaTrainee }) {
  const submit = useApiMutation(() => api.put(`/toa/tp/assessors/${trainee._id}/submit`), "Sent to CUTM for verification");
  const remove = useApiMutation(() => api.delete(`/toa/tp/assessors/${trainee._id}`), "Draft deleted");
  const editable = EDITABLE.includes(trainee.status);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          Open
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{trainee.name}</SheetTitle>
          <SheetDescription>
            {trainee.registrationId} · {trainee.email}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <TraineeStatusBadge status={trainee.status} />
            {editable && <EditTraineeDialog trainee={trainee} />}
            {editable && (
              <ConfirmDialog
                trigger={
                  <Button size="sm">
                    <Send />
                    Submit to CUTM
                  </Button>
                }
                title={`Submit ${trainee.name}?`}
                description="CUTM verifies the details and documents. You cannot edit the application while it is under review."
                confirmLabel="Submit"
                onConfirm={() => submit.mutateAsync(undefined)}
              />
            )}
            {trainee.status === "draft" && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 />
                    Delete draft
                  </Button>
                }
                title="Delete this draft?"
                confirmLabel="Delete"
                destructive
                onConfirm={() => remove.mutateAsync(undefined)}
              />
            )}
          </div>
          {trainee.remarks && (
            <Alert className="border-warning/30 bg-warning/5">
              <AlertTitle>Remarks from CUTM</AlertTitle>
              <AlertDescription>{trainee.remarks}</AlertDescription>
            </Alert>
          )}
          <DetailList
            items={[
              ["Mobile", trainee.mobile],
              ["Date of birth", formatDate(trainee.dob)],
              ["Gender", trainee.gender],
              ["Qualification", trainee.qualification],
              ["Experience", trainee.experienceYears !== undefined ? `${trainee.experienceYears} years` : undefined],
              ["Sector", trainee.sector],
              ["Organisation", [trainee.currentOrganisation, trainee.designation].filter(Boolean).join(" · ")],
              ["State", trainee.state],
              ["ID proof", trainee.idProofType ? `${trainee.idProofType} ${trainee.idProofNumber ?? ""}` : undefined],
            ]}
          />
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Documents</h3>
            <DocumentsForm trainee={trainee} />
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">History</h3>
            <History entries={trainee.history} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ToaAssessorsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaTrainee>("/toa/tp/assessors");
  const inTab = (trainee: ToaTrainee, value: Tab) => value === "all" || (value === "pending" ? ["submitted", "under_review"].includes(trainee.status) : trainee.status === value);
  const rows = data.filter((trainee) => inTab(trainee, tab) && matches(search, trainee.name, trainee.registrationId, trainee.email, trainee.mobile));
  const count = (value: Tab) => data.filter((trainee) => inTab(trainee, value)).length;

  return (
    <>
      <PageHeader title="Assessors" description="People you register for RailTel Training of Assessors. CUTM verifies each one before they can join a batch." actions={<CreateTraineeDialog />} />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "all", label: "All", count: count("all") },
                { value: "draft", label: "Drafts", count: count("draft") },
                { value: "pending", label: "With CUTM", count: count("pending") },
                { value: "correction_required", label: "Correction required", count: count("correction_required") },
                { value: "approved", label: "Approved", count: count("approved") },
                { value: "rejected", label: "Rejected", count: count("rejected") },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID, email…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={tab === "all" ? Users : UserRound} title="No assessors here" description="Register an assessor to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="hidden md:table-cell">Qualification</TableHead>
                <TableHead className="hidden lg:table-cell">Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((trainee) => (
                <TableRow key={trainee._id}>
                  <TableCell>
                    <p className="font-medium">{trainee.name}</p>
                    <p className="text-xs text-muted-foreground">{trainee.registrationId}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{trainee.qualification ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{trainee.experienceYears !== undefined ? `${trainee.experienceYears} yrs` : "—"}</TableCell>
                  <TableCell>
                    <TraineeStatusBadge status={trainee.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(trainee.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <TraineeSheet trainee={trainee} />
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
