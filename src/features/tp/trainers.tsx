"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Plus, Trash2, UserRound } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Course, Sector, Trainer } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field, SelectField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrainingPartner } from "./use-training-partner";

const OPTIONAL_FIELDS = ["educationQualification_1", "certification_course", "relevant_industryExperience"];
const REQUIRED_FIELDS = ["name", "email", "phoneNumber", "PAN_CARD_NO", "AADHAR_NO", "PRN_NO", "state", "district", "city", "pincode"];

function CreateTrainerDialog({ disabled }: { disabled?: boolean }) {
  const sectors = useList<Sector>("/sector/all");
  const courses = useList<Course>("/course/course");
  const [sector, setSector] = useState("");
  const create = useApiMutation((form: FormData) => api.post("/trainer", form), "Trainer added");
  const courseOptions = (courses.data ?? []).filter((course) => course.sectorName === sector);

  return (
    <FormDialog
      wide
      trigger={
        <Button disabled={disabled}>
          <Plus />
          New trainer
        </Button>
      }
      title="Add a trainer"
      submitLabel="Add trainer"
      onSubmit={async (form) => {
        const body = new FormData();
        for (const key of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, "sector", "coursecode"]) {
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
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone" name="phoneNumber" type="tel" required />
        <Field label="PRN number" name="PRN_NO" required />
        <Field label="PAN" name="PAN_CARD_NO" required />
        <Field label="Aadhaar" name="AADHAR_NO" required />
        <SelectField
          label="Sector"
          name="sector"
          required
          value={sector}
          onValueChange={setSector}
          options={(sectors.data ?? []).map((item) => item.name)}
        />
        <SelectField
          key={sector}
          label="Course"
          name="coursecode"
          required
          placeholder={sector ? "Select…" : "Pick a sector first"}
          options={courseOptions.map((course) => ({ value: course.courseCode, label: `${course.courseName} (${course.courseCode})` }))}
        />
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="State" name="state" required options={STATES} />
        <Field label="District" name="district" required />
        <Field label="City" name="city" required />
        <Field label="PIN code" name="pincode" required inputMode="numeric" />
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Highest qualification" name="educationQualification_1" />
        <Field label="Certification course" name="certification_course" />
        <Field label="Industry experience" name="relevant_industryExperience" placeholder="e.g. 5 years" />
        <Field label="Photo" name="image" type="file" accept="image/*" />
      </div>
    </FormDialog>
  );
}

function ResultSheetUpload({ trainer }: { trainer: Trainer }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((file: File) => {
    const body = new FormData();
    body.append("resultSheet", file);
    return api.put(`/trainer/marksheet/${trainer._id}`, body);
  }, "Result sheet uploaded");

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
        {trainer.resultSheet ? "Replace sheet" : "Upload sheet"}
      </Button>
    </>
  );
}

function DeleteTrainer({ trainer }: { trainer: Trainer }) {
  const remove = useApiMutation(() => api.delete(`/trainer/${trainer._id}`), "Trainer removed");
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${trainer.name}`}>
          <Trash2 />
        </Button>
      }
      title={`Remove ${trainer.name}?`}
      description="The trainer is also taken off every batch they are part of."
      confirmLabel="Remove"
      destructive
      onConfirm={() => remove.mutateAsync(undefined)}
    />
  );
}

export function TrainersPage() {
  const { tpId, approved } = useTrainingPartner();
  const [search, setSearch] = useState("");
  const trainers = useList<Trainer>(tpId ? `/trainer/tp/${tpId}` : null);
  const rows = (trainers.data ?? []).filter((trainer) => matches(search, trainer.name, trainer.email, trainer.coursecode, trainer.sector));

  return (
    <>
      <PageHeader
        title="Trainers"
        description="Trainers you can add to batches, and their result sheets."
        actions={<CreateTrainerDialog disabled={!approved} />}
      />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search trainers…" />}>
        {!tpId || trainers.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={UserRound} title="No trainers yet" description="Every batch needs at least one trainer." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Course</TableHead>
                <TableHead className="hidden lg:table-cell">Batches</TableHead>
                <TableHead className="hidden lg:table-cell">Result sheet</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((trainer) => (
                <TableRow key={trainer._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {trainer.profilePic && <AvatarImage src={trainer.profilePic} alt="" />}
                        <AvatarFallback className="text-xs">{trainer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{trainer.name}</p>
                        <p className="text-xs text-muted-foreground">{trainer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{trainer.phoneNumber}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p>{trainer.coursecode}</p>
                    <p className="text-xs text-muted-foreground">{trainer.sector}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary">{trainer.batches?.length ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <FileLink href={trainer.resultSheet} label="Open" />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <ResultSheetUpload trainer={trainer} />
                    <DeleteTrainer trainer={trainer} />
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
