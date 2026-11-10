"use client";

import Link from "next/link";
import { Building2, Check, KeyRound, Layers, MailCheck, MapPin, SearchCheck, Users, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Scheme } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { STATES } from "@/lib/domain/states";
import { Field, SelectField, TextareaField } from "@/components/shared/field";
import { PATTERNS, PasswordFields, SectorCoursePicker, hasSector, list, validatePassword } from "@/components/register/common";
import { FormSection, ReviewSection, StepForm, valueOf, type Step, type StepValues } from "@/components/register/step-form";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["Private", "Government", "Public sector undertaking", "NGO / Trust / Society", "Educational institution", "Corporate"];

// Values the backend takes as they are; everything else is mapped in toPayload.
const PLAIN_FIELDS = [
  "organizationName", "organizationCategory", "affiliation", "dateOfIncorporation", "pan", "prnNo", "centerId",
  "registeredOfficeAddress", "registeredOfficeCity", "registeredOfficeDist", "registeredOfficeState", "registeredOfficePin",
  "registeredOfficeMobile", "registeredOfficeTelephone", "registeredOfficeEmail", "registeredOfficeGst", "website",
  "headOwnerName", "headOwnerDob", "headOwnerMobile", "headOwnerEmail", "headOwnerQualification", "headOwnerPanNo", "headOwnerAadharNo",
  "projectContactPersonName", "projectContactPersonDesignation", "projectContactPersonMobile", "projectContactPersonEmail",
  "password",
];
const UPPERCASE = ["pan", "registeredOfficeGst", "headOwnerPanNo"];

function toPayload(values: StepValues, schemes: Scheme[]) {
  const payload: Record<string, unknown> = {};
  for (const key of PLAIN_FIELDS) {
    const value = valueOf(values, key);
    if (value) payload[key] = UPPERCASE.includes(key) ? value.toUpperCase() : value;
  }
  payload.registeredOfficeEmail = String(payload.registeredOfficeEmail ?? "").toLowerCase();
  payload.scheme = valueOf(values, "scheme");
  payload.schemeType = schemes.find((scheme) => scheme.name === payload.scheme)?.schemeType;
  payload.sector = values.sector ?? [];
  payload.courses = values.courses ?? [];
  return payload;
}

export const joined = (values: StepValues, keys: string[], separator = " · ") =>
  keys.map((key) => valueOf(values, key)).filter(Boolean).join(separator);

export function TrainingPartnerRegistration() {
  const schemes = useList<Scheme>("/scheme");
  const schemeList = schemes.data ?? [];
  const v = valueOf;

  const steps: Step[] = [
    {
      title: "Organisation",
      icon: Building2,
      description: "Legal details of your organisation and the scheme you train under.",
      render: (values) => (
        <>
          <FormSection title="About the organisation">
            <Field label="Organisation name" name="organizationName" required defaultValue={v(values, "organizationName")} className="sm:col-span-2" placeholder="As registered" />
            <SelectField label="Category" name="organizationCategory" required options={CATEGORIES} defaultValue={v(values, "organizationCategory")} />
            <Field label="Date of incorporation" name="dateOfIncorporation" type="date" defaultValue={v(values, "dateOfIncorporation")} />
            <Field label="Affiliation" name="affiliation" defaultValue={v(values, "affiliation")} placeholder="e.g. NSDC" />
            <Field label="PAN" name="pan" required {...PATTERNS.pan} defaultValue={v(values, "pan")} placeholder="ABCDE1234F" />
            <Field label="PRN number" name="prnNo" defaultValue={v(values, "prnNo")} />
          </FormSection>
          <FormSection title="Scheme" description="The scheme decides the fee per candidate and who approves your centres.">
            <SelectField
              label="Scheme"
              name="scheme"
              required
              defaultValue={v(values, "scheme")}
              placeholder={schemes.isLoading ? "Loading…" : "Select…"}
              options={schemeList.map((scheme) => ({ value: scheme.name, label: `${scheme.name} · ${scheme.schemeType}` }))}
            />
            <Field label="Centre / TC ID" name="centerId" required defaultValue={v(values, "centerId")} hint="ID issued to you by the scheme" />
          </FormSection>
        </>
      ),
    },
    {
      title: "Registered office",
      icon: MapPin,
      description: "Where the organisation is registered. The office email becomes your login.",
      render: (values) => (
        <>
          <FormSection title="Address">
            <TextareaField label="Street address" name="registeredOfficeAddress" required rows={2} defaultValue={v(values, "registeredOfficeAddress")} className="sm:col-span-2" />
            <Field label="City" name="registeredOfficeCity" required defaultValue={v(values, "registeredOfficeCity")} />
            <Field label="District" name="registeredOfficeDist" required defaultValue={v(values, "registeredOfficeDist")} />
            <SelectField label="State" name="registeredOfficeState" required options={STATES} defaultValue={v(values, "registeredOfficeState")} />
            <Field label="PIN code" name="registeredOfficePin" required {...PATTERNS.pin} defaultValue={v(values, "registeredOfficePin")} />
          </FormSection>
          <FormSection title="Contact" description="Use an address the organisation monitors: approval mails go here.">
            <Field label="Email (your login)" name="registeredOfficeEmail" type="email" required autoComplete="email" defaultValue={v(values, "registeredOfficeEmail")} className="sm:col-span-2" />
            <Field label="Mobile" name="registeredOfficeMobile" type="tel" required {...PATTERNS.mobile} defaultValue={v(values, "registeredOfficeMobile")} />
            <Field label="Telephone" name="registeredOfficeTelephone" type="tel" defaultValue={v(values, "registeredOfficeTelephone")} />
            <Field label="GSTIN" name="registeredOfficeGst" {...PATTERNS.gst} defaultValue={v(values, "registeredOfficeGst")} />
            <Field label="Website" name="website" type="url" placeholder="https://" defaultValue={v(values, "website")} />
          </FormSection>
        </>
      ),
    },
    {
      title: "People",
      icon: Users,
      description: "Who heads the organisation and who we contact about batches.",
      render: (values) => (
        <>
          <FormSection title="Head of the organisation">
            <Field label="Full name" name="headOwnerName" required defaultValue={v(values, "headOwnerName")} />
            <Field label="Date of birth" name="headOwnerDob" type="date" defaultValue={v(values, "headOwnerDob")} />
            <Field label="Mobile" name="headOwnerMobile" type="tel" required {...PATTERNS.mobile} defaultValue={v(values, "headOwnerMobile")} />
            <Field label="Email" name="headOwnerEmail" type="email" required defaultValue={v(values, "headOwnerEmail")} />
            <Field label="Qualification" name="headOwnerQualification" defaultValue={v(values, "headOwnerQualification")} />
            <Field label="PAN" name="headOwnerPanNo" {...PATTERNS.pan} defaultValue={v(values, "headOwnerPanNo")} />
            <Field label="Aadhaar" name="headOwnerAadharNo" {...PATTERNS.aadhaar} defaultValue={v(values, "headOwnerAadharNo")} />
          </FormSection>
          <FormSection title="Project contact person" description="Day-to-day contact for batches and assessments.">
            <Field label="Full name" name="projectContactPersonName" required defaultValue={v(values, "projectContactPersonName")} />
            <Field label="Designation" name="projectContactPersonDesignation" defaultValue={v(values, "projectContactPersonDesignation")} />
            <Field label="Mobile" name="projectContactPersonMobile" type="tel" required {...PATTERNS.mobile} defaultValue={v(values, "projectContactPersonMobile")} />
            <Field label="Email" name="projectContactPersonEmail" type="email" required defaultValue={v(values, "projectContactPersonEmail")} />
          </FormSection>
        </>
      ),
    },
    {
      title: "Sectors & courses",
      icon: Layers,
      description: "What you train in. You can add more later from your profile.",
      multi: ["sector", "courses"],
      validate: hasSector("sector"),
      render: (values) => <SectorCoursePicker values={values} sectorName="sector" courseName="courses" />,
    },
    {
      title: "Account",
      icon: KeyRound,
      description: "Choose a password. You sign in with the office email and this password.",
      reenter: true,
      validate: validatePassword,
      render: (values) => <PasswordFields values={values} />,
    },
  ];

  return (
    <StepForm
      id="training-partner"
      title="Training partner"
      subtitle="Apply to run skill training under the CUTM Awarding Body. Five short steps and a review. Your progress is saved on this device."
      loginHref="/login/tp"
      steps={steps}
      review={(values, edit) => (
        <>
          <ReviewSection
            title="Organisation"
            onEdit={() => edit(0)}
            items={[
              ["Name", v(values, "organizationName")],
              ["Category", v(values, "organizationCategory")],
              ["Scheme", v(values, "scheme")],
              ["Centre / TC ID", v(values, "centerId")],
              ["Affiliation", v(values, "affiliation")],
              ["Incorporated", v(values, "dateOfIncorporation") && formatDate(v(values, "dateOfIncorporation"))],
              ["PAN", v(values, "pan")?.toUpperCase()],
              ["PRN", v(values, "prnNo")],
            ]}
          />
          <ReviewSection
            title="Registered office"
            onEdit={() => edit(1)}
            items={[
              ["Address", joined(values, ["registeredOfficeAddress", "registeredOfficeCity", "registeredOfficeDist", "registeredOfficeState", "registeredOfficePin"], ", ")],
              ["Login email", v(values, "registeredOfficeEmail")?.toLowerCase()],
              ["Mobile", v(values, "registeredOfficeMobile")],
              ["GSTIN", v(values, "registeredOfficeGst")?.toUpperCase()],
              ["Website", v(values, "website")],
            ]}
          />
          <ReviewSection
            title="People"
            onEdit={() => edit(2)}
            items={[
              ["Head of organisation", joined(values, ["headOwnerName", "headOwnerMobile", "headOwnerEmail"])],
              ["Project contact", joined(values, ["projectContactPersonName", "projectContactPersonMobile", "projectContactPersonEmail"])],
            ]}
          />
          <ReviewSection title="Sectors & courses" onEdit={() => edit(3)} items={[["Sectors", list(values.sector)], ["Courses", list(values.courses)]]} />
        </>
      )}
      onSubmit={(values) => api.post("/tp", toPayload(values, schemeList))}
      done={<RegistrationDone login="/login/tp" what="training partner" />}
    />
  );
}

const NEXT_STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Check, title: "Application received", text: "Your details are saved with the awarding body." },
  { icon: SearchCheck, title: "Review", text: "The awarding body checks your application and documents." },
  { icon: MailCheck, title: "Approval email", text: "You hear back by email once a decision is made." },
];

export function RegistrationDone({ login, what }: { login: string; what: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center sm:py-12">
      <span className="flex size-16 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/30 ring-8 ring-success/10 animate-in zoom-in-50 duration-500">
        <Check className="size-8" strokeWidth={3} />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">Application submitted</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Thank you. Every {what} application is reviewed by the awarding body. You can sign in now to follow its status.
      </p>

      <ol className="mt-10 w-full max-w-md rounded-xl border bg-card p-5 text-left shadow-xs">
        {NEXT_STEPS.map((item, index) => (
          <li key={item.title} className="relative flex gap-4 pb-6 last:pb-0">
            {index < NEXT_STEPS.length - 1 && <span aria-hidden className="absolute top-10 left-[1.125rem] h-[calc(100%-2.5rem)] w-px bg-border" />}
            <span
              className={
                index === 0
                  ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
                  : "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              }
            >
              <item.icon className="size-4" />
            </span>
            <div className="pt-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild>
          <Link href={login}>Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
