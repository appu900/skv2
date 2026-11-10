"use client";

import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Course, Sector, TrainingPartner } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { STATES } from "@/lib/domain/states";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTrainingPartner } from "./use-training-partner";

// Fields a training partner may change once the awarding body grants edit permission.
const EDITABLE: { section: string; fields: [keyof TrainingPartner, string][] }[] = [
  {
    section: "Registered office",
    fields: [
      ["registeredOfficeAddress", "Address"],
      ["registeredOfficeCity", "City"],
      ["registeredOfficeDist", "District"],
      ["registeredOfficePin", "PIN code"],
      ["registeredOfficeMobile", "Mobile"],
      ["registeredOfficeGst", "GST number"],
      ["website", "Website"],
    ],
  },
  {
    section: "Head of the organisation",
    fields: [
      ["headOwnerName", "Name"],
      ["headOwnerMobile", "Mobile"],
      ["headOwnerEmail", "Email"],
    ],
  },
  {
    section: "Project contact person",
    fields: [
      ["projectContactPersonName", "Name"],
      ["projectContactPersonMobile", "Mobile"],
      ["projectContactPersonEmail", "Email"],
    ],
  },
];

function EditDetailsDialog({ tp }: { tp: TrainingPartner }) {
  const update = useApiMutation((body: Record<string, unknown>) => api.put(`/tp/${tp._id}`, body), "Profile updated");
  return (
    <FormDialog
      wide
      trigger={
        <Button variant="outline" size="sm">
          <Pencil />
          Edit details
        </Button>
      }
      title="Edit organisation details"
      onSubmit={(form) => {
        const body: Record<string, unknown> = { registeredOfficeState: form.get("registeredOfficeState") };
        EDITABLE.flatMap((group) => group.fields).forEach(([key]) => (body[key] = String(form.get(key) ?? "").trim()));
        return update.mutateAsync(body);
      }}
    >
      {EDITABLE.map((group) => (
        <div key={group.section} className="flex flex-col gap-3">
          <p className="text-sm font-semibold">{group.section}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map(([key, label]) => (
              <Field key={key} label={label} name={key} defaultValue={String(tp[key] ?? "")} />
            ))}
            {group.section === "Registered office" && (
              <SelectField label="State" name="registeredOfficeState" options={STATES} defaultValue={tp.registeredOfficeState} />
            )}
          </div>
        </div>
      ))}
    </FormDialog>
  );
}

function ChangeEmailDialog({ tp }: { tp: TrainingPartner }) {
  const update = useApiMutation((email: string) => api.put(`/tp/info/email/${tp._id}`, { email }), "Login email changed");
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm">
          <Mail />
          Change
        </Button>
      }
      title="Change login email"
      description="You sign in with this address from now on."
      onSubmit={(form) => update.mutateAsync(String(form.get("email")).trim())}
    >
      <Field label="New email" name="email" type="email" required defaultValue={tp.registeredOfficeEmail} />
    </FormDialog>
  );
}

function AddSectorDialog({ tp, sectors }: { tp: TrainingPartner; sectors: Sector[] }) {
  const add = useApiMutation((sector: string) => api.put(`/tp/sectors/${tp._id}`, { sector }), "Sector added");
  const options = sectors.map((sector) => sector.name).filter((name) => !tp.sector?.includes(name));
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm" disabled={options.length === 0}>
          <Plus />
          Sector
        </Button>
      }
      title="Add a sector"
      onSubmit={(form) => add.mutateAsync(String(form.get("sector")))}
    >
      <SelectField label="Sector" name="sector" required options={options} />
    </FormDialog>
  );
}

function AddCourseDialog({ tp, courses }: { tp: TrainingPartner; courses: Course[] }) {
  const add = useApiMutation((course: string) => api.put(`/tp/courses/${tp._id}`, { course }), "Course added");
  const options = courses
    .filter((course) => tp.sector?.includes(course.sectorName) && !tp.courses?.includes(course.courseName))
    .map((course) => ({ value: course.courseName, label: `${course.courseName} · ${course.sectorName}` }));
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm" disabled={options.length === 0}>
          <Plus />
          Course
        </Button>
      }
      title="Add a course"
      description="Only courses of your sectors are listed."
      onSubmit={(form) => add.mutateAsync(String(form.get("course")))}
    >
      <SelectField label="Course" name="course" required options={options} />
    </FormDialog>
  );
}

// ---------------------------------------------------------------- page

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

function CopyValue({ value }: { value?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="group inline-flex items-center gap-1.5">
      <span className="font-mono tracking-tight">{value}</span>
      <button
        type="button"
        aria-label={`Copy ${value}`}
        onClick={() => navigator.clipboard.writeText(value).then(() => toast.success("Copied"))}
        className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        <Copy className="size-3.5" />
      </button>
    </span>
  );
}

function InfoItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{children || <span className="text-muted-foreground">—</span>}</dd>
      </div>
    </div>
  );
}

function PersonCard({ role, name, detail, mobile, email }: { role: string; name?: string; detail?: string; mobile?: string; email?: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{name ? initials(name) : "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{name || "Not provided"}</p>
          <p className="text-xs text-muted-foreground">{[role, detail].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        {mobile && (
          <a href={`tel:${mobile}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Phone className="size-4" />
            {mobile}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-2 text-muted-foreground hover:text-foreground">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{email}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, action, children }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Optional details that make a profile complete; shown as a progress meter.
const COMPLETENESS: (keyof TrainingPartner)[] = [
  "pan", "prnNo", "registeredOfficeGst", "website", "affiliation", "dateOfIncorporation",
  "registeredOfficeAddress", "registeredOfficeMobile", "headOwnerName", "headOwnerMobile", "headOwnerEmail",
  "projectContactPersonName", "projectContactPersonMobile", "projectContactPersonEmail",
];

export function ProfilePage() {
  const { profile } = useTrainingPartner();
  const sectors = useList<Sector>("/sector/all");
  const courses = useList<Course>("/course/course");
  const tp = profile.data;

  if (!tp) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <LoadingRows rows={6} />
      </div>
    );
  }

  const corporate = tp.schemeType === "Corporate";
  const filled = COMPLETENESS.filter((key) => Boolean(tp[key])).length + (tp.sector?.length ? 1 : 0) + (tp.courses?.length ? 1 : 0);
  const completeness = Math.round((filled / (COMPLETENESS.length + 2)) * 100);
  const address = [tp.registeredOfficeAddress, tp.registeredOfficeCity, tp.registeredOfficeDist, tp.registeredOfficeState, tp.registeredOfficePin]
    .filter(Boolean)
    .join(", ");
  // ** courses of the partner grouped under the sector they belong to
  const courseSector = new Map((courses.data ?? []).map((course) => [course.courseName, course.sectorName]));
  const grouped = new Map<string, string[]>((tp.sector ?? []).map((sector) => [sector, []]));
  for (const course of tp.courses ?? []) {
    const sector = courseSector.get(course) ?? "Other";
    grouped.set(sector, [...(grouped.get(sector) ?? []), course]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* banner */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="relative h-28 bg-linear-to-r from-primary to-primary/75 sm:h-32 dark:from-primary/45 dark:to-primary/15">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_90%_120%,rgba(255,255,255,0.16),transparent_45%)]" />
        </div>
        <div className="relative flex flex-col gap-5 px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <span className="flex size-20 items-center justify-center rounded-2xl border-4 border-card bg-card text-2xl font-semibold text-primary shadow-md">
              {initials(tp.organizationName)}
            </span>
            <div className="flex items-center gap-2">
              {tp.editPermission ? (
                <EditDetailsDialog tp={tp} />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-8 gap-1.5 px-3">
                      <Lock />
                      Editing locked
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Ask the awarding body to enable editing</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{tp.organizationName}</h1>
              <ApplicationStatusBadge status={tp.applicationStatus} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {tp.tpCode && (
                <span className="inline-flex items-center gap-1">
                  <Hash className="size-3.5" />
                  {tp.tpCode}
                </span>
              )}
              {tp.organizationCategory && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {tp.organizationCategory}
                </span>
              )}
              {tp.registeredOfficeState && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {tp.registeredOfficeState}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Joined {formatDate(tp.createdAt)}
              </span>
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Scheme", value: tp.scheme, hint: tp.schemeType },
              { label: "Centre ID", value: tp.centerId, hint: "Issued by the scheme" },
              corporate
                ? { label: "Corporate fee", value: tp.organizationCorporatePaymentFee ? formatCurrency(tp.organizationCorporatePaymentFee) : "Not set", hint: "Per candidate + GST" }
                : { label: "Sectors", value: String(tp.sector?.length ?? 0), hint: `${tp.courses?.length ?? 0} ${tp.courses?.length === 1 ? "course" : "courses"}` },
              { label: "Profile", value: `${completeness}%`, hint: completeness === 100 ? "Complete" : "Details filled in", progress: completeness },
            ].map((fact) => (
              <div key={fact.label} className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">{fact.label}</p>
                <p className="mt-0.5 truncate font-semibold">{fact.value || "—"}</p>
                {"progress" in fact && fact.progress !== undefined ? (
                  <Progress value={fact.progress} className="mt-2 h-1.5" />
                ) : (
                  <p className="truncate text-xs text-muted-foreground">{fact.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <SectionCard icon={Landmark} title="Legal & registration" description="Identifiers of the organisation">
            <dl className="grid gap-5 sm:grid-cols-2">
              <InfoItem icon={FileText} label="PAN">
                <CopyValue value={tp.pan} />
              </InfoItem>
              <InfoItem icon={Receipt} label="GSTIN">
                <CopyValue value={tp.registeredOfficeGst} />
              </InfoItem>
              <InfoItem icon={Hash} label="PRN">
                <CopyValue value={tp.prnNo} />
              </InfoItem>
              <InfoItem icon={BadgeCheck} label="Affiliation">
                {tp.affiliation}
              </InfoItem>
              <InfoItem icon={CalendarDays} label="Incorporated">
                {tp.dateOfIncorporation && formatDate(tp.dateOfIncorporation)}
              </InfoItem>
              <InfoItem icon={Globe} label="Website">
                {tp.website && (
                  <a href={tp.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    {tp.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </InfoItem>
            </dl>
          </SectionCard>

          <SectionCard icon={MapPin} title="Registered office">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InfoItem icon={MapPin} label="Address">
                  {address}
                </InfoItem>
              </div>
              <InfoItem icon={Phone} label="Mobile">
                {tp.registeredOfficeMobile && (
                  <a href={`tel:${tp.registeredOfficeMobile}`} className="hover:text-primary">
                    {tp.registeredOfficeMobile}
                  </a>
                )}
              </InfoItem>
              <InfoItem icon={Phone} label="Telephone">
                {tp.registeredOfficeTelephone}
              </InfoItem>
            </dl>
          </SectionCard>

          <SectionCard icon={Users} title="People" description="Who the awarding body contacts">
            <div className="grid gap-4 md:grid-cols-2">
              <PersonCard role="Head of organisation" name={tp.headOwnerName} detail={tp.headOwnerQualification} mobile={tp.headOwnerMobile} email={tp.headOwnerEmail} />
              <PersonCard
                role="Project contact"
                name={tp.projectContactPersonName}
                detail={tp.projectContactPersonDesignation}
                mobile={tp.projectContactPersonMobile}
                email={tp.projectContactPersonEmail}
              />
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard icon={KeyRound} title="Sign-in" action={<ChangeEmailDialog tp={tp} />}>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Login email</p>
                <p className="truncate text-sm font-medium">{tp.registeredOfficeEmail}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Layers}
            title="Sectors & courses"
            description="What you are allowed to train in"
          >
            <div className="mb-4 grid grid-cols-2 gap-2 [&_button]:w-full">
              <AddSectorDialog tp={tp} sectors={sectors.data ?? []} />
              <AddCourseDialog tp={tp} courses={courses.data ?? []} />
            </div>
            {grouped.size === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No sectors yet. Add one to start creating batches.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...grouped.entries()].map(([sector, list]) => (
                  <div key={sector} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize">{sector}</p>
                      <Badge variant="secondary">{list.length} {list.length === 1 ? "course" : "courses"}</Badge>
                    </div>
                    {list.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {list.map((course) => (
                          <Badge key={course} variant="outline" className="font-normal">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">No courses added in this sector</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
