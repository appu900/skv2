"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Clock,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Batch, Student, Trainer } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { approverOf, batchStage, formatCurrency, formatDate } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";
import { DetailList } from "@/components/shared/detail-list";
import { FileLink } from "@/components/shared/file-link";
import { LoadingRows } from "@/components/shared/loading-rows";
import { matches } from "@/components/shared/search-input";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCandidateDialog, AddTrainersDialog, PhotoUpload, ReturnedNotice, SubmitChecklist } from "./batch-manage";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// ** Aadhaar / UID is shown with only its last 4 digits
const maskUid = (uid?: string) => (uid ? `XXXX XXXX ${uid.slice(-4)}` : undefined);

// ---------------------------------------------------------------- progress

function journey(batch: Batch) {
  const approval = `${approverOf(batch.schemeType)} approval`;
  const steps = ["Draft", approval, "Payment", "Assessment", "Certified"];
  let current = 0;
  if (batch.certificateIssued) current = steps.length;
  else if (batch.paymentStatus || batch.isAssigned) current = steps.indexOf("Assessment");
  else if (batch.batchActivePermission && batch.approvedByGovernmentBody) current = steps.indexOf("Payment");
  else if (batch.batchActivePermission) current = steps.indexOf(approval);
  return { steps, current };
}

function Journey({ batch }: { batch: Batch }) {
  const { steps, current } = journey(batch);
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                done && "border-success/30 bg-success/10 text-success",
                active && "border-primary bg-primary text-primary-foreground",
                !done && !active && "text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : <span className="tabular-nums">{index + 1}</span>}
              {step}
            </span>
            {index < steps.length - 1 && <span aria-hidden className={cn("h-px w-6", done ? "bg-success/50" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- candidate

function Fact({ icon: Icon, label, children }: { icon?: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children || children === 0 ? children : <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

function CandidateStatus({ student }: { student: Student }) {
  if (student.absent) return <Badge variant="warning">Absent</Badge>;
  if (student.Grade) return <Badge variant="success">Grade {student.Grade}</Badge>;
  if (!student.profilepic) return <Badge variant="destructive">No photo</Badge>;
  return <Badge variant="outline">Enrolled</Badge>;
}

function CandidateSheet({ student, editable, onOpenChange }: { student: Student | null; editable: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={Boolean(student)} onOpenChange={onOpenChange}>
      <SheetContent>
        {student && (
          <>
            <div className="sr-only">
              <SheetTitle>{student.name}</SheetTitle>
              <SheetDescription>Candidate details</SheetDescription>
            </div>
            <div className="relative h-24 shrink-0 bg-linear-to-r from-primary to-primary/70 dark:from-primary/45 dark:to-primary/15" />
            <div className="flex flex-col gap-6 px-6 pb-8">
              <div className="-mt-14 flex items-end justify-between gap-4">
                <Avatar className="size-28 rounded-2xl border-4 border-background shadow-lg">
                  {student.profilepic && <AvatarImage src={student.profilepic} alt={student.name} className="rounded-2xl object-cover" />}
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">{initials(student.name)}</AvatarFallback>
                </Avatar>
                {editable && <PhotoUpload student={student} />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{student.name}</h2>
                  <CandidateStatus student={student} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  MPR {student.MPR_Id}
                  {student.redg_No && ` · Reg. no ${student.redg_No}`}
                </p>
              </div>

              <section className="flex flex-col gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IdCard className="size-4" />
                  </span>
                  Identity
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-primary/15 bg-primary/[0.03] dark:bg-primary/[0.06] p-4">
                  <Fact icon={IdCard} label="MPR ID">{student.MPR_Id}</Fact>
                  <Fact icon={IdCard} label="SNA ID">{student.SNA_Id}</Fact>
                  <Fact label="Registration no">{student.redg_No}</Fact>
                  <Fact label="Aadhaar / UID">{maskUid(student.uid)}</Fact>
                  <Fact icon={CalendarDays} label="Date of birth">{student.dob && formatDate(student.dob)}</Fact>
                  <Fact label="Gender">{student.gender}</Fact>
                  <Fact label="Category">{student.category}</Fact>
                  <Fact label="Religion">{student.religion}</Fact>
                  <Fact label="Nationality">{student.nationality}</Fact>
                  <Fact icon={GraduationCap} label="Qualification">{student.generalqualification}</Fact>
                  <Fact label="Father's name">{student.fathername}</Fact>
                  <Fact label="Mother's name">{student.mothername}</Fact>
                </dl>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2">
                    <Phone className="size-4" />
                  </span>
                  Contact
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-chart-2/20 bg-chart-2/[0.04] dark:bg-chart-2/[0.07] p-4">
                  <Fact icon={Phone} label="Mobile">
                    {student.mobile && (
                      <a href={`tel:${student.mobile}`} className="hover:text-primary">
                        {student.mobile}
                      </a>
                    )}
                  </Fact>
                  <Fact icon={Mail} label="Email">
                    {student.email && (
                      <a href={`mailto:${student.email}`} className="hover:text-primary">
                        {student.email}
                      </a>
                    )}
                  </Fact>
                  <div className="col-span-2">
                    <Fact icon={MapPin} label="Address">
                      {[student.address, student.city, student.district, student.state, student.pincode].filter(Boolean).join(", ")}
                    </Fact>
                  </div>
                </dl>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
                    <GraduationCap className="size-4" />
                  </span>
                  Training
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-success/20 bg-success/[0.04] dark:bg-success/[0.07] p-4">
                  <Fact label="Course">{student.course}</Fact>
                  <Fact label="Module">{student.module}</Fact>
                  <Fact label="Sector">{student.sector_name}</Fact>
                  <Fact label="Centre code">{student.cenid}</Fact>
                  <Fact icon={CalendarDays} label="Training period">
                    {student.traininstartdate && `${formatDate(student.traininstartdate)} – ${formatDate(student.trainingenddate)}`}
                  </Fact>
                  <Fact icon={Clock} label="Hours attended">
                    {student.trainingHours !== undefined && `${student.trainingHours} of ${student.totalhours ?? "—"} h`}
                  </Fact>
                  <Fact label="Training days">{student.totaldays}</Fact>
                  <Fact label="Enrolled on">{student.createdAt && formatDate(student.createdAt)}</Fact>
                </dl>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CandidateCard({ student, onOpen }: { student: Student; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <Avatar className="size-14 rounded-xl">
        {student.profilepic && <AvatarImage src={student.profilepic} alt="" className="rounded-xl object-cover" />}
        <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary">{initials(student.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium group-hover:text-primary">{student.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          MPR {student.MPR_Id}
          {student.redg_No && ` · ${student.redg_No}`}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <CandidateStatus student={student} />
          {student.gender && <span className="text-xs text-muted-foreground">{student.gender}</span>}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------- page

export function BatchDetailPage({ id }: { id: string }) {
  const { data: batch, isLoading, isError } = useItem<Batch>(`/batch/${id}`);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // ** an unknown id answers 200 with no data, a foreign or malformed one an error
  if (isError || (!isLoading && !batch)) {
    return <EmptyState icon={Building2} title="Batch not found" description="It may have been removed, or it belongs to another training partner." />;
  }
  if (isLoading || !batch) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <LoadingRows rows={6} />
      </div>
    );
  }

  const students = batch.students.filter((student): student is Student => typeof student === "object");
  const trainers = (batch.trainers ?? []).filter((trainer): trainer is Trainer => typeof trainer === "object");
  const draft = !batch.batchActivePermission;
  const withPhoto = students.filter((student) => student.profilepic).length;
  const shown = students.filter((student) => matches(search, student.name, student.MPR_Id, student.redg_No, student.mobile));
  const openStudent = students.find((student) => student._id === openId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 text-muted-foreground">
        <Link href="/tp/batches">
          <ArrowLeft />
          All batches
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{batch.courseName}</h1>
                <StageBadge stage={batchStage(batch)} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-mono">{batch.ABN_Number}</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {batch.centerName}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                </span>
                <span>
                  {batch.scheme} · {batch.schemeType}
                </span>
              </p>
            </div>
            {draft && <AddCandidateDialog batch={batch} />}
          </div>
          <Separator />
          <Journey batch={batch} />
        </CardContent>
      </Card>

      <StatGrid>
        <StatCard label="Candidates" value={students.length} hint={draft ? "Can still be added" : "Enrolment closed"} icon={Users} />
        <StatCard label="Photos" value={`${withPhoto}/${students.length}`} hint={withPhoto === students.length ? "All uploaded" : "Missing photos block submission"} icon={Camera} tone={withPhoto === students.length ? "success" : "warning"} />
        <StatCard label="Trainers" value={trainers.length} hint={trainers.length ? trainers.map((trainer) => trainer.name).join(", ") : "Add at least one"} icon={UserRound} tone="info" />
        <StatCard label="Amount payable" value={batch.amountToPaid ? formatCurrency(batch.amountToPaid) : "—"} hint={batch.paymentStatus ? "Paid" : batch.amountToPaid ? "Calculated on submission" : "After submission"} icon={Wallet} tone={batch.paymentStatus ? "success" : "primary"} />
      </StatGrid>

      <ReturnedNotice batch={batch} />
      {draft && (
        <div className="max-w-xl">
          <SubmitChecklist batch={batch} students={students} trainers={trainers} />
        </div>
      )}

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">
            Candidates <Badge variant="secondary">{students.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="trainers">
            Trainers <Badge variant="secondary">{trainers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="details">Batch details</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="mt-4 flex flex-col gap-4">
          {students.length > 0 && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, MPR, mobile…" className="pl-8" />
            </div>
          )}
          {students.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState icon={Users} title="No candidates yet" description={draft ? "Add candidates with their photos to fill this batch." : "This batch has no candidates."} />
              </CardContent>
            </Card>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No candidate matches “{search}”.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((student) => (
                <CandidateCard key={student._id} student={student} onOpen={() => setOpenId(student._id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trainers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trainers</CardTitle>
              <CardDescription>Who trains this batch</CardDescription>
              {!batch.certificateIssued && (
                <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                  <AddTrainersDialog batch={batch} current={trainers} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {trainers.length === 0 ? (
                <EmptyState icon={UserRound} title="No trainers yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trainer</TableHead>
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="hidden md:table-cell">Course</TableHead>
                      <TableHead className="text-right">Result sheet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainers.map((trainer) => (
                      <TableRow key={trainer._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              {trainer.profilePic && <AvatarImage src={trainer.profilePic} alt="" className="object-cover" />}
                              <AvatarFallback className="text-xs">{initials(trainer.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{trainer.name}</p>
                              <p className="text-xs text-muted-foreground">{trainer.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{trainer.phoneNumber}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p>{trainer.coursecode}</p>
                          <p className="text-xs text-muted-foreground">{trainer.sector}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <FileLink href={trainer.resultSheet} label="Open" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course & centre</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  ["ABN", batch.ABN_Number],
                  ["Course", `${batch.courseName}${batch.courseCode ? ` (${batch.courseCode})` : ""}`],
                  ["Sector", batch.sectorName],
                  ["Level / credit", [batch.courseLevel, batch.courseCredit].filter(Boolean).join(" / ")],
                  ["Duration", batch.courseDuration ? `${batch.courseDuration} hours` : null],
                  ["Centre", `${batch.centerName}${batch.CenterCode ? ` (${batch.CenterCode})` : ""}`],
                  ["Scheme", `${batch.scheme} · ${batch.schemeType}`],
                  ["State", batch.state],
                  ["Training period", `${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}`],
                  ["Assessor", batch.assessorName],
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <DetailList
                items={[
                  ["Amount", batch.amountToPaid ? formatCurrency(batch.amountToPaid) : null],
                  ["Per candidate", batch.perStudentCost ? formatCurrency(batch.perStudentCost) : null],
                  ["Transaction ID", batch.transactionId],
                  ["Paid by", batch.paymentPublishedBy],
                  ["Proof uploaded", batch.clientPaymentStatus ? "Yes" : "No"],
                  ["Confirmed by awarding body", batch.paymentStatus ? "Yes" : "No"],
                ]}
              />
              <div className="flex flex-wrap gap-4">
                <FileLink href={batch.prePaymentInvoice} label="Pre-payment invoice" />
                <FileLink href={batch.postPaymentInvoice} label="Payment receipt" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CandidateSheet student={openStudent} editable={draft} onOpenChange={(open) => !open && setOpenId(null)} />
    </div>
  );
}
