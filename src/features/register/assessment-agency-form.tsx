"use client";

import { ClipboardCheck, FileUp, Globe, KeyRound, Layers, Phone } from "lucide-react";
import { api } from "@/lib/api/client";
import { STATES } from "@/lib/domain/states";
import { Field, SelectField, TextareaField } from "@/components/shared/field";
import { ChoiceChips, FileDrop, PATTERNS, PasswordFields, SectorCoursePicker, fileName, hasSector, list, validatePassword } from "@/components/register/common";
import { FormSection, ReviewSection, StepForm, valueOf, type Step, type StepValues } from "@/components/register/step-form";
import { RegistrationDone, joined } from "./training-partner-form";

const LEGAL_STATUS = ["Private limited company", "Public limited company", "LLP", "Partnership firm", "Proprietorship", "Society / Trust", "Government body"];
const REGIONS = ["North", "South", "East", "West", "North-East", "Central", "Pan India"];
const ACCOUNT_TYPES = ["Current", "Savings"];

const TEXT_FIELDS = [
  "agencyName", "legalStatusOfTheOrganization", "COMPANY_PAN_NO", "COMPANY_GST_NO", "websiteLink", "headOfTheOrganization",
  "NO_OF_BRANCHES", "total_no_of_certified_Assessor", "email", "phoneNumber", "officeAddress", "communicationAddress",
  "SPOC_NAME", "SPOC_EMAIL", "SPOC_CONTACT_NO", "BRANCH_ADDRESS", "geographical_region",
  "AccountNumber", "IFSC_Code", "MICR_code", "AccountType", "BankName", "BranchName", "password",
];
const UPPERCASE = ["COMPANY_PAN_NO", "COMPANY_GST_NO", "IFSC_Code"];

function toFormData(values: StepValues) {
  const body = new FormData();
  for (const key of TEXT_FIELDS) {
    let value = valueOf(values, key);
    if (!value) continue;
    if (UPPERCASE.includes(key)) value = value.toUpperCase();
    if (key === "email") value = value.toLowerCase();
    body.append(key, value);
  }
  const states = values.state_Under_geographicalRegion as string[] | undefined;
  if (states?.length) body.append("state_Under_geographicalRegion", states.join(", "));
  for (const sector of (values.sectors as string[] | undefined) ?? []) body.append("sectors[]", sector);
  for (const course of (values.courses as string[] | undefined) ?? []) body.append("courses[]", course);
  // ** files last: multer reads text fields that come before the files
  body.append("LETTER_OF_NCVET", values.LETTER_OF_NCVET as File);
  body.append("logo", values.logo as File);
  return body;
}

const v = valueOf;

const steps: Step[] = [
  {
    title: "Agency",
    icon: ClipboardCheck,
    description: "Legal details of the assessment agency.",
    render: (values) => (
      <>
        <FormSection title="About the agency">
          <Field label="Agency name" name="agencyName" required defaultValue={v(values, "agencyName")} className="sm:col-span-2" placeholder="As registered" />
          <SelectField label="Legal status" name="legalStatusOfTheOrganization" options={LEGAL_STATUS} defaultValue={v(values, "legalStatusOfTheOrganization")} />
          <Field label="Head of the organisation" name="headOfTheOrganization" required defaultValue={v(values, "headOfTheOrganization")} />
          <Field label="Website" name="websiteLink" type="url" required placeholder="https://" defaultValue={v(values, "websiteLink")} />
          <Field label="Certified assessors" name="total_no_of_certified_Assessor" type="number" min={0} defaultValue={v(values, "total_no_of_certified_Assessor")} />
        </FormSection>
        <FormSection title="Tax registration">
          <Field label="Company PAN" name="COMPANY_PAN_NO" required {...PATTERNS.pan} placeholder="ABCDE1234F" defaultValue={v(values, "COMPANY_PAN_NO")} />
          <Field label="Company GSTIN" name="COMPANY_GST_NO" required {...PATTERNS.gst} placeholder="21ABCDE1234F1Z5" defaultValue={v(values, "COMPANY_GST_NO")} />
        </FormSection>
      </>
    ),
  },
  {
    title: "Contact",
    icon: Phone,
    description: "How we reach you. The agency email becomes your login.",
    render: (values) => (
      <>
        <FormSection title="Agency contact">
          <Field label="Email (your login)" name="email" type="email" required autoComplete="email" defaultValue={v(values, "email")} />
          <Field label="Phone" name="phoneNumber" type="tel" required {...PATTERNS.mobile} defaultValue={v(values, "phoneNumber")} />
          <TextareaField label="Office address" name="officeAddress" required rows={2} defaultValue={v(values, "officeAddress")} className="sm:col-span-2" />
          <TextareaField label="Communication address" name="communicationAddress" required rows={2} defaultValue={v(values, "communicationAddress")} className="sm:col-span-2" />
        </FormSection>
        <FormSection title="Single point of contact (SPOC)" description="The person who coordinates assessments with us.">
          <Field label="Full name" name="SPOC_NAME" required defaultValue={v(values, "SPOC_NAME")} />
          <Field label="Mobile" name="SPOC_CONTACT_NO" type="tel" required {...PATTERNS.mobile} defaultValue={v(values, "SPOC_CONTACT_NO")} />
          <Field label="Email" name="SPOC_EMAIL" type="email" required defaultValue={v(values, "SPOC_EMAIL")} className="sm:col-span-2" />
        </FormSection>
      </>
    ),
  },
  {
    title: "Coverage",
    icon: Globe,
    description: "Where the agency can run assessments.",
    multi: ["state_Under_geographicalRegion"],
    render: (values) => (
      <>
        <FormSection title="Branches">
          <Field label="Number of branches" name="NO_OF_BRANCHES" type="number" min={0} required defaultValue={v(values, "NO_OF_BRANCHES")} />
          <SelectField label="Geographical region" name="geographical_region" options={REGIONS} defaultValue={v(values, "geographical_region")} />
          <TextareaField label="Branch addresses" name="BRANCH_ADDRESS" required rows={3} hint="One branch per line" defaultValue={v(values, "BRANCH_ADDRESS")} className="sm:col-span-2" />
        </FormSection>
        <FormSection title="States covered" description="Select every state where you can send assessors." className="sm:grid-cols-1">
          <ChoiceChips name="state_Under_geographicalRegion" options={STATES} defaultValues={(values.state_Under_geographicalRegion as string[] | undefined) ?? []} />
        </FormSection>
      </>
    ),
  },
  {
    title: "Sectors & courses",
    icon: Layers,
    description: "Sectors and courses you are able to assess.",
    multi: ["sectors", "courses"],
    validate: (values) => hasSector("sectors")(values) ?? (((values.courses as string[]) ?? []).length ? null : "Pick at least one course"),
    render: (values) => <SectorCoursePicker values={values} sectorName="sectors" courseName="courses" />,
  },
  {
    title: "Documents & bank",
    icon: FileUp,
    description: "Upload your NCVET letter and logo. Bank details can also be added later.",
    reenter: true,
    render: (values) => (
      <>
        <FormSection title="Documents" description="Up to 10 MB each." className="sm:grid-cols-1">
          <FileDrop label="NCVET recognition letter" name="LETTER_OF_NCVET" values={values} accept=".pdf,image/jpeg,image/png" hint="PDF, JPG or PNG" />
          <FileDrop label="Agency logo" name="logo" values={values} accept="image/jpeg,image/png" hint="JPG or PNG · printed on certificates" />
        </FormSection>
        <FormSection title="Bank account" description="Optional now. The awarding body pays your invoices into this account.">
          <Field label="Bank name" name="BankName" defaultValue={v(values, "BankName")} />
          <Field label="Branch" name="BranchName" defaultValue={v(values, "BranchName")} />
          <Field label="Account number" name="AccountNumber" inputMode="numeric" pattern="[0-9]{6,20}" title="6 to 20 digits" defaultValue={v(values, "AccountNumber")} />
          <SelectField label="Account type" name="AccountType" options={ACCOUNT_TYPES} defaultValue={v(values, "AccountType")} />
          <Field label="IFSC" name="IFSC_Code" {...PATTERNS.ifsc} placeholder="SBIN0001234" defaultValue={v(values, "IFSC_Code")} />
          <Field label="MICR" name="MICR_code" inputMode="numeric" pattern="[0-9]{9}" title="9 digit MICR code" maxLength={9} defaultValue={v(values, "MICR_code")} />
        </FormSection>
      </>
    ),
  },
  {
    title: "Account",
    icon: KeyRound,
    description: "Choose a password. You sign in with the agency email and this password.",
    reenter: true,
    validate: validatePassword,
    render: (values) => <PasswordFields values={values} />,
  },
];

export function AssessmentAgencyRegistration() {
  return (
    <StepForm
      id="assessment-agency"
      title="Assessment agency"
      subtitle="Apply to assess candidates for the CUTM Awarding Body. Six short steps and a review. Your progress is saved on this device."
      loginHref="/login/aa"
      steps={steps}
      review={(values, edit) => (
        <>
          <ReviewSection
            title="Agency"
            onEdit={() => edit(0)}
            items={[
              ["Name", v(values, "agencyName")],
              ["Legal status", v(values, "legalStatusOfTheOrganization")],
              ["Head", v(values, "headOfTheOrganization")],
              ["PAN", v(values, "COMPANY_PAN_NO")?.toUpperCase()],
              ["GSTIN", v(values, "COMPANY_GST_NO")?.toUpperCase()],
              ["Website", v(values, "websiteLink")],
              ["Certified assessors", v(values, "total_no_of_certified_Assessor")],
            ]}
          />
          <ReviewSection
            title="Contact"
            onEdit={() => edit(1)}
            items={[
              ["Login email", v(values, "email")?.toLowerCase()],
              ["Phone", v(values, "phoneNumber")],
              ["Office address", v(values, "officeAddress")],
              ["SPOC", joined(values, ["SPOC_NAME", "SPOC_CONTACT_NO", "SPOC_EMAIL"])],
            ]}
          />
          <ReviewSection
            title="Coverage"
            onEdit={() => edit(2)}
            items={[
              ["Branches", v(values, "NO_OF_BRANCHES")],
              ["Region", v(values, "geographical_region")],
              ["States", list(values.state_Under_geographicalRegion)],
            ]}
          />
          <ReviewSection title="Sectors & courses" onEdit={() => edit(3)} items={[["Sectors", list(values.sectors)], ["Courses", list(values.courses)]]} />
          <ReviewSection
            title="Documents & bank"
            onEdit={() => edit(4)}
            items={[
              ["NCVET letter", fileName(values.LETTER_OF_NCVET)],
              ["Logo", fileName(values.logo)],
              ["Bank", joined(values, ["BankName", "BranchName"], ", ")],
              ["Account", v(values, "AccountNumber")],
              ["IFSC", v(values, "IFSC_Code")?.toUpperCase()],
            ]}
          />
        </>
      )}
      onSubmit={(values) => api.post("/aa/create", toFormData(values))}
      done={<RegistrationDone login="/login/aa" what="assessment agency" />}
    />
  );
}
