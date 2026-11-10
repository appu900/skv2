"use client";

import { useState } from "react";
import { IdCard, ImageUp, Pencil, Plus, UserRound } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile, openPrivateFile } from "@/lib/api/download";
import type { OfflineAssessor } from "@/lib/api/offline";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const FIELDS = ["name", "mobile", "email", "qualification", "experienceYears", "sectors", "idProofType", "idProofNumber", "bloodGroup", "validTill", "address", "status"];
const payload = (form: FormData) => Object.fromEntries(FIELDS.map((field) => [field, form.get(field)]).filter(([, value]) => value !== null && value !== ""));

function AssessorFields({ assessor }: { assessor?: OfflineAssessor }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name="name" required defaultValue={assessor?.name} />
      <Field label="Mobile" name="mobile" required pattern="[6-9][0-9]{9}" defaultValue={assessor?.mobile} />
      <Field label="Email" name="email" type="email" defaultValue={assessor?.email} />
      <Field label="Qualification" name="qualification" defaultValue={assessor?.qualification} />
      <Field label="Experience (years)" name="experienceYears" type="number" min={0} max={60} defaultValue={assessor?.experienceYears} />
      <Field label="Sectors (comma separated)" name="sectors" defaultValue={assessor?.sectors?.join(", ")} />
      <SelectField label="ID proof" name="idProofType" options={["Aadhaar", "PAN", "Passport", "Voter ID", "Driving Licence"]} defaultValue={assessor?.idProofType} />
      <Field label="ID proof number" name="idProofNumber" hint={assessor?.idProofNumber ? `Saved: ${assessor.idProofNumber}` : undefined} />
      <SelectField label="Blood group" name="bloodGroup" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} defaultValue={assessor?.bloodGroup} />
      <Field label="ID card valid till" name="validTill" type="date" defaultValue={assessor?.validTill?.slice(0, 10)} hint={assessor ? undefined : "Defaults to one year from today"} />
      {assessor && <SelectField label="Status" name="status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} defaultValue={assessor.status} />}
      <Field label="Address" name="address" defaultValue={assessor?.address} className="sm:col-span-2" />
    </div>
  );
}

function PhotoUpload({ assessor }: { assessor: OfflineAssessor }) {
  const upload = useApiMutation((form: FormData) => api.put(`/offline/admin/assessors/${assessor._id}/photo`, form), "Photo uploaded");
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <ImageUp />
          Photo
        </Button>
      }
      title={`Photo of ${assessor.name}`}
      description="A passport-style JPG or PNG, printed on the ID card."
      submitLabel="Upload"
      onSubmit={(form) => upload.mutateAsync(form)}
    >
      <div className="flex flex-col gap-3">
        {assessor.photoKey && (
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => openPrivateFile("/offline/admin/files", assessor.photoKey as string)}>
            Open current photo
          </Button>
        )}
        <Input type="file" name="photo" accept="image/jpeg,image/png" required />
      </div>
    </FormDialog>
  );
}

export function OfflineAssessorsPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<OfflineAssessor>("/offline/admin/assessors");
  const create = useApiMutation((body: Record<string, unknown>) => api.post("/offline/admin/assessors", body), "Assessor added");
  const rows = data.filter((assessor) => matches(search, assessor.name, assessor.assessorCode, assessor.mobile, assessor.sectors.join(" ")));
  return (
    <>
      <PageHeader
        title="CUTM assessors"
        description="CUTM's own assessors, used for offline partners where CUTM acts as the assessment agency. Upload a photo to print the ID card."
        actions={
          <FormDialog
            wide
            trigger={
              <Button>
                <Plus />
                Add assessor
              </Button>
            }
            title="Add a CUTM assessor"
            submitLabel="Add assessor"
            onSubmit={(form) => create.mutateAsync(payload(form))}
          >
            <AssessorFields />
          </FormDialog>
        }
      />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search name, code, sector…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={UserRound} title="No assessors yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="hidden md:table-cell">Qualification</TableHead>
                <TableHead className="hidden lg:table-cell">Sectors</TableHead>
                <TableHead className="hidden sm:table-cell">Valid till</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((assessor) => (
                <TableRow key={assessor._id}>
                  <TableCell>
                    <p className="font-medium">{assessor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assessor.assessorCode} · {assessor.mobile}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {assessor.qualification ?? "—"}
                    {assessor.experienceYears !== undefined && <span className="text-xs text-muted-foreground"> · {assessor.experienceYears} yrs</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{assessor.sectors.join(", ") || "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(assessor.validTill)}</TableCell>
                  <TableCell>
                    <Badge variant={assessor.status === "active" ? "success" : "outline"}>{assessor.status === "active" ? "Active" : "Inactive"}</Badge>
                    {!assessor.photoKey && <Badge variant="warning" className="ml-1">No photo</Badge>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <PhotoUpload assessor={assessor} />
                    <Button variant="ghost" size="sm" onClick={() => downloadFile(`/offline/admin/assessors/${assessor._id}/id-card.pdf`, `${assessor.assessorCode}-id-card.pdf`)}>
                      <IdCard />
                      ID card
                    </Button>
                    <EditAssessor assessor={assessor} />
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

function EditAssessor({ assessor }: { assessor: OfflineAssessor }) {
  const update = useApiMutation((body: Record<string, unknown>) => api.put(`/offline/admin/assessors/${assessor._id}`, body), "Saved");
  return (
    <FormDialog
      wide
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Edit ${assessor.name}`}>
          <Pencil />
        </Button>
      }
      title={`Edit ${assessor.name}`}
      onSubmit={(form) => update.mutateAsync(payload(form))}
    >
      <AssessorFields assessor={assessor} />
    </FormDialog>
  );
}
