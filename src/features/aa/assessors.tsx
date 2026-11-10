"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Plus, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Assessor, Course, Sector } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgency } from "./use-agency";

const TEXT_FIELDS = [
  "name", "email", "phoneNumber", "assesoraId", "panNumber", "adharNumber", "sector", "courseCode",
  "education_qualification_1", "education_qualification_2", "education_qualification_3", "experience", "other_experience",
  "certified_In_Any_course", "state", "dist", "city", "pincode", "enrolledInAnyOtherAssesmentAgency", "enrolledInAnyOtherSSC",
];

function CreateAssessorDialog({ disabled }: { disabled?: boolean }) {
  const sectors = useList<Sector>("/sector/all");
  const courses = useList<Course>("/course/course");
  const [sector, setSector] = useState("");
  const create = useApiMutation((form: FormData) => api.post("/assessor", form), "Assessor added");
  const courseOptions = (courses.data ?? []).filter((course) => course.sectorName === sector);

  return (
    <FormDialog
      wide
      trigger={
        <Button disabled={disabled}>
          <Plus />
          New assessor
        </Button>
      }
      title="Add an assessor"
      submitLabel="Add assessor"
      onSubmit={async (form) => {
        const body = new FormData();
        for (const key of TEXT_FIELDS) {
          const value = String(form.get(key) ?? "").trim();
          if (value) body.append(key, value);
        }
        const photo = form.get("image");
        if (photo instanceof File && photo.size > 0) body.append("image", photo);
        await create.mutateAsync(body);
        setSector("");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="Assessor ID" name="assesoraId" required hint="ID issued by the sector skill council" />
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone" name="phoneNumber" type="tel" required />
        <Field label="PAN" name="panNumber" required />
        <Field label="Aadhaar" name="adharNumber" required />
        <SelectField label="Sector" name="sector" required value={sector} onValueChange={setSector} options={(sectors.data ?? []).map((item) => item.name)} />
        <SelectField
          key={sector}
          label="Course"
          name="courseCode"
          required
          placeholder={sector ? "Select…" : "Pick a sector first"}
          options={courseOptions.map((course) => ({ value: course.courseCode, label: `${course.courseName} (${course.courseCode})` }))}
        />
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Qualification 1" name="education_qualification_1" required />
        <Field label="Qualification 2" name="education_qualification_2" required />
        <Field label="Qualification 3" name="education_qualification_3" required />
        <Field label="Experience" name="experience" required placeholder="e.g. 6 years" />
        <Field label="Other experience" name="other_experience" required />
        <Field label="Certified in" name="certified_In_Any_course" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Enrolled with another agency?" name="enrolledInAnyOtherAssesmentAgency" required options={["No", "Yes"]} defaultValue="No" />
        <SelectField label="Enrolled with another SSC?" name="enrolledInAnyOtherSSC" required options={["No", "Yes"]} defaultValue="No" />
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="State" name="state" required options={STATES} />
        <Field label="District" name="dist" required />
        <Field label="City" name="city" required />
        <Field label="PIN code" name="pincode" required inputMode="numeric" />
        <Field label="Photo" name="image" type="file" accept="image/*" className="sm:col-span-2" />
      </div>
    </FormDialog>
  );
}

function MarksheetUpload({ assessor }: { assessor: Assessor }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((file: File) => {
    const body = new FormData();
    body.append("markSheet", file);
    return api.put(`/assessor/marksheet/${assessor._id}`, body);
  }, "Mark sheet uploaded");
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = "";
        }}
      />
      <Button variant="ghost" size="sm" disabled={upload.isPending} onClick={() => input.current?.click()}>
        {upload.isPending ? <Loader2 className="animate-spin" /> : <FileUp />}
        {assessor.resultSheet ? "Replace sheet" : "Upload sheet"}
      </Button>
    </>
  );
}

export function AssessorsPage() {
  const { aaId, approved } = useAgency();
  const [search, setSearch] = useState("");
  const assessors = useList<Assessor>(aaId ? `/assessor/aa/${aaId}` : null);
  const rows = (assessors.data ?? []).filter((item) => matches(search, item.name, item.assesoraId, item.email, item.courseCode, item.sector));

  return (
    <>
      <PageHeader title="Assessors" description="Assessors you can assign to exams, and their mark sheets." actions={<CreateAssessorDialog disabled={!approved} />} />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search assessors…" />}>
        {!aaId || assessors.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No assessors yet" description="Every exam needs an assessor before marks can be uploaded." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Course</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden lg:table-cell">Mark sheet</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((assessor) => (
                <TableRow key={assessor._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {assessor.profilePic && <AvatarImage src={assessor.profilePic} alt="" className="object-cover" />}
                        <AvatarFallback className="text-xs">{assessor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{assessor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {assessor.assesoraId} · {assessor.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{assessor.phoneNumber}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p>{assessor.courseCode}</p>
                    <p className="text-xs text-muted-foreground">{assessor.sector}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{[assessor.city, assessor.state].filter(Boolean).join(", ")}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <FileLink href={assessor.resultSheet} label="Open" />
                  </TableCell>
                  <TableCell className="text-right">
                    <MarksheetUpload assessor={assessor} />
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
