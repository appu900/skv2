"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api/client";
import type { Scheme } from "@/lib/api/models";
import type { OfflineTp } from "@/lib/api/offline";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField, TextareaField } from "@/components/shared/field";
import { LoadingRows } from "@/components/shared/loading-rows";
import { PATTERNS, SectorCoursePicker } from "@/components/register/common";
import { FormSection } from "@/components/register/step-form";
import { Button } from "@/components/ui/button";

// Same details the public training partner signup asks for (no password: offline partners never log in).
const FIELDS = [
  "category", "status", "organizationName", "organizationCategory", "dateOfIncorporation", "affiliation", "pan", "prnNo", "scheme", "centerId",
  "registeredOfficeAddress", "registeredOfficeCity", "registeredOfficeDist", "registeredOfficeState", "registeredOfficePin",
  "registeredOfficeEmail", "registeredOfficeMobile", "registeredOfficeTelephone", "registeredOfficeGst", "website",
  "headOwnerName", "headOwnerDob", "headOwnerMobile", "headOwnerEmail", "headOwnerQualification", "headOwnerPanNo", "headOwnerAadharNo",
  "projectContactPersonName", "projectContactPersonDesignation", "projectContactPersonMobile", "projectContactPersonEmail", "notes",
];
const CATEGORIES = ["Private", "Government", "Public sector undertaking", "NGO / Trust / Society", "Educational institution", "Corporate"];
const UPPERCASE = ["pan", "registeredOfficeGst", "headOwnerPanNo"];

function payload(form: FormData) {
  const body: Record<string, unknown> = {};
  for (const field of FIELDS) {
    const value = form.get(field);
    if (value === null || value === "") continue;
    body[field] = UPPERCASE.includes(field) ? String(value).toUpperCase() : value;
  }
  body.sector = form.getAll("sector");
  body.courses = form.getAll("courses");
  return body;
}

const day = (value?: string) => value?.slice(0, 10);

function PartnerForm({ tp }: { tp?: OfflineTp }) {
  const router = useRouter();
  const schemes = useList<Scheme>("/scheme");
  const [pending, setPending] = useState(false);
  const save = useApiMutation(
    (body: Record<string, unknown>) => (tp ? api.put<{ data: OfflineTp }>(`/offline/admin/tps/${tp._id}`, body) : api.post<{ data: OfflineTp }>("/offline/admin/tps", body)),
    tp ? "Partner saved" : "Offline partner added"
  );

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          await save.mutateAsync(payload(new FormData(event.currentTarget)));
          router.push("/admin/offline");
        } catch {
          // toast comes from the mutation
        } finally {
          setPending(false);
        }
      }}
    >
      <FormSection title="Offline partner" description="How CUTM handles this partner. It gets no login: CUTM enters its batches and issues its documents.">
        <SelectField label="Type" name="category" required options={["Government", "Corporate"]} defaultValue={tp?.category} />
        {tp && <SelectField label="Status" name="status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} defaultValue={tp.status} />}
      </FormSection>

      <FormSection title="Organisation">
        <Field label="Organisation name" name="organizationName" required defaultValue={tp?.organizationName} className="sm:col-span-2" placeholder="As registered" />
        <SelectField label="Category" name="organizationCategory" required options={CATEGORIES} defaultValue={tp?.organizationCategory} />
        <Field label="Date of incorporation" name="dateOfIncorporation" type="date" defaultValue={day(tp?.dateOfIncorporation)} />
        <Field label="Affiliation" name="affiliation" defaultValue={tp?.affiliation} placeholder="e.g. NSDC" />
        <Field label="PAN" name="pan" required {...PATTERNS.pan} defaultValue={tp?.pan} placeholder="ABCDE1234F" />
        <Field label="PRN number" name="prnNo" defaultValue={tp?.prnNo} />
      </FormSection>

      <FormSection title="Scheme">
        <SelectField
          label="Scheme"
          name="scheme"
          required
          defaultValue={tp?.scheme}
          placeholder={schemes.isLoading ? "Loading…" : "Select…"}
          options={(schemes.data ?? []).map((scheme) => ({ value: scheme.name, label: `${scheme.name} · ${scheme.schemeType}` }))}
        />
        <Field label="Centre / TC ID" name="centerId" required defaultValue={tp?.centerId} hint="ID issued to the partner by the scheme" />
      </FormSection>

      <FormSection title="Registered office">
        <TextareaField label="Street address" name="registeredOfficeAddress" required rows={2} defaultValue={tp?.registeredOfficeAddress} className="sm:col-span-2" />
        <Field label="City" name="registeredOfficeCity" required defaultValue={tp?.registeredOfficeCity} />
        <Field label="District" name="registeredOfficeDist" required defaultValue={tp?.registeredOfficeDist} />
        <SelectField label="State" name="registeredOfficeState" required options={STATES} defaultValue={tp?.registeredOfficeState} />
        <Field label="PIN code" name="registeredOfficePin" required {...PATTERNS.pin} defaultValue={tp?.registeredOfficePin} />
        <Field label="Email" name="registeredOfficeEmail" type="email" required defaultValue={tp?.registeredOfficeEmail} className="sm:col-span-2" />
        <Field label="Mobile" name="registeredOfficeMobile" type="tel" required {...PATTERNS.mobile} defaultValue={tp?.registeredOfficeMobile} />
        <Field label="Telephone" name="registeredOfficeTelephone" type="tel" defaultValue={tp?.registeredOfficeTelephone} />
        <Field label="GSTIN" name="registeredOfficeGst" {...PATTERNS.gst} defaultValue={tp?.registeredOfficeGst} />
        <Field label="Website" name="website" type="url" placeholder="https://" defaultValue={tp?.website} />
      </FormSection>

      <FormSection title="Head of the organisation">
        <Field label="Full name" name="headOwnerName" required defaultValue={tp?.headOwnerName} />
        <Field label="Date of birth" name="headOwnerDob" type="date" defaultValue={day(tp?.headOwnerDob)} />
        <Field label="Mobile" name="headOwnerMobile" type="tel" required {...PATTERNS.mobile} defaultValue={tp?.headOwnerMobile} />
        <Field label="Email" name="headOwnerEmail" type="email" required defaultValue={tp?.headOwnerEmail} />
        <Field label="Qualification" name="headOwnerQualification" defaultValue={tp?.headOwnerQualification} />
        <Field label="PAN" name="headOwnerPanNo" {...PATTERNS.pan} defaultValue={tp?.headOwnerPanNo} />
        <Field label="Aadhaar" name="headOwnerAadharNo" {...PATTERNS.aadhaar} hint={tp?.headOwnerAadharNo ? `Saved: ${tp.headOwnerAadharNo}. Leave blank to keep it.` : undefined} />
      </FormSection>

      <FormSection title="Project contact person" description="Day-to-day contact for batches and assessments.">
        <Field label="Full name" name="projectContactPersonName" required defaultValue={tp?.projectContactPersonName} />
        <Field label="Designation" name="projectContactPersonDesignation" defaultValue={tp?.projectContactPersonDesignation} />
        <Field label="Mobile" name="projectContactPersonMobile" type="tel" required {...PATTERNS.mobile} defaultValue={tp?.projectContactPersonMobile} />
        <Field label="Email" name="projectContactPersonEmail" type="email" required defaultValue={tp?.projectContactPersonEmail} />
      </FormSection>

      <SectorCoursePicker values={{ sector: tp?.sector ?? [], courses: tp?.courses ?? [] }} sectorName="sector" courseName="courses" />

      <FormSection title="Notes">
        <TextareaField label="Internal notes" name="notes" rows={3} defaultValue={tp?.notes} className="sm:col-span-2" placeholder="e.g. how they reached CUTM, agreed document formats" />
      </FormSection>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          {tp ? "Save changes" : "Add partner"}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/offline">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Back() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
      <Link href="/admin/offline">
        <ArrowLeft />
        Offline partners
      </Link>
    </Button>
  );
}

export function NewOfflinePartnerPage() {
  return (
    <div className="flex flex-col gap-6">
      <Back />
      <PageHeader title="Add an offline training partner" description="The same details a partner gives when it signs up online. Offline partners get no login." />
      <PartnerForm />
    </div>
  );
}

export function EditOfflinePartnerPage({ id }: { id: string }) {
  const { data, isLoading } = useItem<OfflineTp>(`/offline/admin/tps/${id}`);
  return (
    <div className="flex flex-col gap-6">
      <Back />
      <PageHeader title={data ? data.organizationName : "Training partner"} description={data ? `${data.tpCode} · ${data.category} · offline partner` : undefined} />
      {isLoading || !data ? <LoadingRows rows={8} /> : <PartnerForm tp={data} />}
    </div>
  );
}
