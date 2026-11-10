"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Download, FileSpreadsheet, FileText, Megaphone, Pencil, Plus, Save, Trash2, Upload, UserCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile, openPrivateFile } from "@/lib/api/download";
import type { OfflineAssessor, OfflineBatch, OfflineCandidate, OfflineCertificate } from "@/lib/api/offline";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { Field, SelectField, TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchFields, batchPayload, componentDraft } from "./batch-form";
import { BATCH_STATUS } from "./batches";

interface Detail {
  batch: OfflineBatch;
  candidates: OfflineCandidate[];
  certificates: OfflineCertificate[];
}

const CANDIDATE_FIELDS = ["candidateId", "name", "fatherName", "gender", "dob", "mobile", "category"];
const candidatePayload = (form: FormData) => Object.fromEntries(CANDIDATE_FIELDS.map((field) => [field, form.get(field)]).filter(([, value]) => value !== null && value !== ""));

function CandidateFields({ candidate }: { candidate?: OfflineCandidate }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" required defaultValue={candidate?.name} className="sm:col-span-2" />
      <Field label="Father's name" name="fatherName" defaultValue={candidate?.fatherName} />
      <Field label="Partner's candidate ID" name="candidateId" defaultValue={candidate?.candidateId} />
      <SelectField label="Gender" name="gender" options={["Female", "Male", "Other"]} defaultValue={candidate?.gender} />
      <Field label="Date of birth" name="dob" type="date" defaultValue={candidate?.dob?.slice(0, 10)} />
      <Field label="Mobile" name="mobile" pattern="[6-9][0-9]{9}" defaultValue={candidate?.mobile} />
      <Field label="Category" name="category" defaultValue={candidate?.category} placeholder="e.g. GEN, OBC, SC, ST" />
    </div>
  );
}

function CandidatesTab({ detail, locked }: { detail: Detail; locked: boolean }) {
  const { batch, candidates } = detail;
  const base = `/offline/admin/batches/${batch._id}`;
  const add = useApiMutation((body: Record<string, unknown>) => api.post(`${base}/candidates`, body), "Candidate added");
  const importFile = useApiMutation((form: FormData) => api.post<{ data: { imported: number } }>(`${base}/candidates/import`, form), (response) => `${response.data.data.imported} candidate(s) imported`);
  const update = useApiMutation(({ id, body }: { id: string; body: Record<string, unknown> }) => api.put(`${base}/candidates/${id}`, body), "Saved");
  const remove = useApiMutation((id: string) => api.delete(`${base}/candidates/${id}`), "Candidate removed");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Candidates ({candidates.length})</CardTitle>
        <CardDescription>From the partner's list. Each gets a CUTM enrolment number used on every document.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!locked && (
          <div className="flex flex-wrap gap-2">
            <FormDialog
              wide
              trigger={
                <Button size="sm">
                  <Plus />
                  Add candidate
                </Button>
              }
              title="Add a candidate"
              onSubmit={(form) => add.mutateAsync(candidatePayload(form))}
            >
              <CandidateFields />
            </FormDialog>
            <Button variant="outline" size="sm" onClick={() => downloadFile("/offline/admin/candidates-template.xlsx", "candidates-template.xlsx")}>
              <FileSpreadsheet />
              Candidate template
            </Button>
            <FormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Upload />
                  Import from Excel
                </Button>
              }
              title="Import candidates"
              description="Fill the candidate template. Every row is checked first; if one is wrong nothing is saved and the errors are listed."
              submitLabel="Import"
              onSubmit={(form) => importFile.mutateAsync(form)}
            >
              <Input type="file" name="file" accept=".xlsx" required />
            </FormDialog>
          </div>
        )}
        {candidates.length === 0 ? (
          <EmptyState icon={UserCheck} title="No candidates yet" description="Add them one by one or import the partner's list." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="hidden md:table-cell">Father's name</TableHead>
                <TableHead className="hidden lg:table-cell">Gender · DOB</TableHead>
                <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate, index) => (
                <TableRow key={candidate._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.enrollmentNumber}
                      {candidate.candidateId ? ` · ${candidate.candidateId}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{candidate.fatherName ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {[candidate.gender, candidate.dob ? formatDate(candidate.dob) : null].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{candidate.mobile ?? "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {!locked && (
                      <>
                        <FormDialog
                          wide
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Edit ${candidate.name}`}>
                              <Pencil />
                            </Button>
                          }
                          title={`Edit ${candidate.name}`}
                          onSubmit={(form) => update.mutateAsync({ id: candidate._id, body: candidatePayload(form) })}
                        >
                          <CandidateFields candidate={candidate} />
                        </FormDialog>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Remove ${candidate.name}`}>
                              <Trash2 />
                            </Button>
                          }
                          title={`Remove ${candidate.name}?`}
                          confirmLabel="Remove"
                          destructive
                          onConfirm={() => remove.mutateAsync(candidate._id)}
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type Draft = { attendance: "present" | "absent" | ""; marks: Record<string, string> };
function AssessmentTab({ detail, locked }: { detail: Detail; locked: boolean }) {
  const { batch, candidates } = detail;
  const base = `/offline/admin/batches/${batch._id}`;
  const assessors = useList<OfflineAssessor>("/offline/admin/assessors");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  useEffect(() => {
    setDrafts(Object.fromEntries(candidates.map((candidate) => [candidate._id, { attendance: candidate.attendance ?? "", marks: Object.fromEntries(batch.components.map((component) => [component.key, candidate.marks?.[component.key] !== undefined ? String(candidate.marks[component.key]) : ""])) }])));
  }, [candidates, batch.components]);
  const setAssessor = useApiMutation((body: Record<string, unknown>) => api.put(base, body), "Assessment details saved");
  const save = useApiMutation(
    () =>
      api.put<{ data: { pending: number } }>(`${base}/results`, {
        entries: Object.entries(drafts)
          .filter(([, draft]) => draft.attendance === "absent" || (draft.attendance === "present" && batch.components.every((component) => draft.marks[component.key] !== "")))
          .map(([candidate, draft]) => ({ candidate, attendance: draft.attendance, marks: Object.fromEntries(Object.entries(draft.marks).map(([key, value]) => [key, Number(value)])) })),
      }),
    (response) => (response.data.data.pending ? `Saved; ${response.data.data.pending} candidate(s) still without marks` : "All results saved")
  );
  const importFile = useApiMutation((form: FormData) => api.post(`${base}/results/import`, form), "Results imported");
  const sheet = useApiMutation(({ kind, form }: { kind: "attendance" | "result"; form: FormData }) => api.put(`${base}/sheets/${kind}`, form), "Original sheet uploaded");
  const totalMax = batch.components.reduce((sum, component) => sum + component.max, 0);
  const set = (id: string, patch: Partial<Draft>) => setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment by CUTM</CardTitle>
          <CardDescription>CUTM acts as the assessment agency for offline partners.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setAssessor.mutate({ assessor: form.get("assessor"), assessmentDate: form.get("assessmentDate") });
            }}
          >
            <SelectField
              label="Assessor"
              name="assessor"
              required
              defaultValue={batch.assessor?._id}
              options={(assessors.data ?? []).filter((assessor) => assessor.status === "active").map((assessor) => ({ value: assessor._id, label: `${assessor.name} (${assessor.assessorCode})` }))}
            />
            <Field label="Assessment date" name="assessmentDate" type="date" required defaultValue={batch.assessmentDate?.slice(0, 10)} />
            <Button type="submit" disabled={locked || setAssessor.isPending}>
              <Save />
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance and marks</CardTitle>
          <CardDescription>
            Pass mark {batch.passPercent}% of {totalMax}. Grades: A ≥ 85%, B ≥ 70%, C ≥ 60%, D ≥ pass mark, else F.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add candidates first.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Attendance</TableHead>
                    {batch.components.map((component) => (
                      <TableHead key={component.key} className="text-right">
                        {component.label} ({component.max})
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => {
                    const draft = drafts[candidate._id] ?? { attendance: "", marks: {} };
                    return (
                      <TableRow key={candidate._id}>
                        <TableCell>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.enrollmentNumber}</p>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex rounded-lg border p-0.5">
                            {(["present", "absent"] as const).map((value) => (
                              <button
                                key={value}
                                type="button"
                                disabled={locked}
                                onClick={() => set(candidate._id, { attendance: value })}
                                className={cn("rounded-md px-2.5 py-1 text-xs font-medium", draft.attendance === value ? (value === "present" ? "bg-success text-white" : "bg-destructive text-white") : "text-muted-foreground hover:bg-muted")}
                              >
                                {value === "present" ? "Present" : "Absent"}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                        {batch.components.map((component) => (
                          <TableCell key={component.key} className="text-right">
                            <Input
                              type="number"
                              min={0}
                              max={component.max}
                              step="0.5"
                              className="ml-auto w-20 text-right"
                              aria-label={`${component.label} of ${candidate.name}`}
                              disabled={locked || draft.attendance !== "present"}
                              value={draft.marks[component.key] ?? ""}
                              onChange={(event) => set(candidate._id, { marks: { ...draft.marks, [component.key]: event.target.value } })}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right tabular-nums">{candidate.result === "Absent" ? "AB" : candidate.total ?? "—"}</TableCell>
                        <TableCell>
                          {candidate.result ? (
                            <Badge variant={candidate.result === "Pass" ? "success" : candidate.result === "Fail" ? "destructive" : "outline"}>
                              {candidate.result}
                              {candidate.grade && candidate.result !== "Absent" ? ` · ${candidate.grade}` : ""}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!locked && candidates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
                <Save />
                Save attendance and marks
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadFile(`${base}/results-template.xlsx`, `${batch.batchCode}-results.xlsx`)}>
                <FileSpreadsheet />
                Marks template
              </Button>
              <FormDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Upload />
                    Import marks
                  </Button>
                }
                title="Import attendance and marks"
                description="Use the marks template of this batch. Nothing is saved if any row is wrong."
                submitLabel="Import"
                onSubmit={(form) => importFile.mutateAsync(form)}
              >
                <Input type="file" name="file" accept=".xlsx" required />
              </FormDialog>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Original signed sheets</CardTitle>
          <CardDescription>Scans of the attendance and result sheets signed at the assessment, kept as evidence.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(["attendance", "result"] as const).map((kind) => {
            const key = kind === "attendance" ? batch.attendanceSheetKey : batch.resultSheetKey;
            return (
              <form
                key={kind}
                className="flex flex-col gap-2 rounded-lg border p-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formElement = event.currentTarget;
                  await sheet.mutateAsync({ kind, form: new FormData(formElement) }).catch(() => {});
                  formElement.reset();
                }}
              >
                <p className="text-sm font-medium">{kind === "attendance" ? "Attendance sheet" : "Result sheet"}</p>
                {key ? (
                  <Button type="button" variant="link" size="sm" className="h-auto self-start p-0" onClick={() => openPrivateFile("/offline/admin/files", key)}>
                    Open uploaded scan
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Not uploaded</p>
                )}
                <div className="flex gap-2">
                  <Input type="file" name="file" accept="image/jpeg,image/png,application/pdf" required />
                  <Button type="submit" variant="outline" size="sm" disabled={sheet.isPending}>
                    <Upload />
                    Upload
                  </Button>
                </div>
              </form>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ detail }: { detail: Detail }) {
  const { batch, candidates, certificates } = detail;
  const base = `/offline/admin/batches/${batch._id}`;
  const publish = useApiMutation(() => api.put<{ data: { issued: number; candidates: number } }>(`${base}/publish`), (response) => `Published: ${response.data.data.issued} certificate(s) for ${response.data.data.candidates} candidate(s)`);
  const revoke = useApiMutation(({ id, reason }: { id: string; reason: string }) => api.put(`/offline/admin/certificates/${id}/revoke`, { reason }), "Certificate revoked");
  const ready = candidates.length > 0 && candidates.every((candidate) => candidate.result);
  const nameOf = (id: string) => candidates.find((candidate) => candidate._id === id)?.name;
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
          <CardDescription>Generated in this partner's format (partner + scheme, partner, scheme, then the CUTM default). Change formats under Document formats.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadFile(`${base}/attendance-sheet.pdf`, `${batch.batchCode}-attendance-sheet.pdf`)}>
            <FileText />
            Attendance sheet
          </Button>
          <Button variant="outline" disabled={!ready} onClick={() => downloadFile(`${base}/result-sheet.pdf`, `${batch.batchCode}-result-sheet.pdf`)}>
            <FileText />
            Result sheet
          </Button>
          {batch.status !== "published" ? (
            <ConfirmDialog
              trigger={
                <Button disabled={!ready || !batch.assessor || !batch.assessmentDate}>
                  <Megaphone />
                  Publish and issue certificates
                </Button>
              }
              title="Publish this batch?"
              description={`${candidates.filter((candidate) => candidate.result === "Pass").length} of ${candidates.length} candidate(s) passed and get a certificate. The batch is locked afterwards.`}
              confirmLabel="Publish"
              onConfirm={() => publish.mutateAsync(undefined)}
            />
          ) : (
            <Button onClick={() => downloadFile(`${base}/certificates.pdf`, `${batch.batchCode}-certificates.pdf`)}>
              <Download />
              All certificates (one PDF)
            </Button>
          )}
        </CardContent>
        {(!ready || !batch.assessor || !batch.assessmentDate) && batch.status !== "published" && (
          <CardContent>
            <p className="text-xs text-muted-foreground">To publish: every candidate needs attendance and marks, and the assessor and assessment date must be set.</p>
          </CardContent>
        )}
      </Card>
      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certificates ({certificates.filter((certificate) => certificate.status === "valid").length} valid)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate._id}>
                    <TableCell>
                      <p className="font-medium">{certificate.certificateNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(certificate.issueDate)}</p>
                    </TableCell>
                    <TableCell>{certificate.snapshot.name ?? nameOf(certificate.candidate)}</TableCell>
                    <TableCell>
                      <Badge variant={certificate.status === "valid" ? "success" : "destructive"}>{certificate.status === "valid" ? "Valid" : "Revoked"}</Badge>
                      {certificate.statusReason && <p className="mt-1 text-xs text-muted-foreground">{certificate.statusReason}</p>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/verify/offline/${certificate.verifyCode}`} target="_blank" rel="noreferrer">
                          Verify page
                        </a>
                      </Button>
                      {certificate.status === "valid" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => downloadFile(`/offline/admin/certificates/${certificate._id}/pdf`, `${certificate.snapshot.enrollmentNumber}-certificate.pdf`)}>
                            <Download />
                            PDF
                          </Button>
                          <FormDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Ban />
                                Revoke
                              </Button>
                            }
                            title={`Revoke ${certificate.certificateNumber}?`}
                            description="The verification page will show it as revoked."
                            submitLabel="Revoke"
                            onSubmit={(form) => revoke.mutateAsync({ id: certificate._id, reason: String(form.get("reason")).trim() })}
                          >
                            <TextareaField label="Reason" name="reason" required rows={3} />
                          </FormDialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function OfflineBatchDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = useItem<Detail>(`/offline/admin/batches/${id}`);
  const [components, setComponents] = useState(componentDraft());
  useEffect(() => {
    if (data) setComponents(componentDraft(data.batch.components));
  }, [data]);
  const update = useApiMutation((body: Record<string, unknown>) => api.put(`/offline/admin/batches/${id}`, body), "Batch saved");
  const remove = useApiMutation(() => api.delete(`/offline/admin/batches/${id}`), "Batch deleted");
  if (isLoading || !data) return <LoadingRows rows={8} />;
  const { batch, candidates } = data;
  const tp = typeof batch.tp === "object" ? batch.tp : null;
  const locked = batch.status === "published";
  const marked = candidates.some((candidate) => candidate.total !== null);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
        <Link href="/admin/offline/batches">
          <ArrowLeft />
          All offline batches
        </Link>
      </Button>
      <PageHeader
        title={batch.jobRole}
        description={`${batch.batchCode}${batch.externalBatchId ? ` · ${batch.externalBatchId}` : ""} · ${tp?.organizationName ?? ""}${batch.scheme ? ` · ${batch.scheme}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={BATCH_STATUS[batch.status][1]}>{BATCH_STATUS[batch.status][0]}</Badge>
            {!locked && (
              <FormDialog
                wide
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil />
                    Edit batch
                  </Button>
                }
                title="Edit batch"
                onSubmit={(form) => {
                  const body = batchPayload(form, components);
                  if (marked) delete body.components;
                  return update.mutateAsync(body);
                }}
              >
                <BatchFields batch={batch} components={components} setComponents={setComponents} lockComponents={marked} />
              </FormDialog>
            )}
            {!locked && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 />
                    Delete
                  </Button>
                }
                title="Delete this batch and its candidates?"
                confirmLabel="Delete"
                destructive
                onConfirm={async () => {
                  await remove.mutateAsync(undefined);
                  router.replace("/admin/offline/batches");
                }}
              />
            )}
          </div>
        }
      />
      {locked && (
        <Alert>
          <AlertDescription>Published on {formatDate(batch.publishedAt as string | undefined)}. The batch is locked; revoke a certificate if one was issued in error.</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue={candidates.length === 0 ? "candidates" : locked ? "documents" : "assessment"}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="documents">Documents & certificates</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent>
              <DetailList
                items={[
                  ["Training partner", tp ? `${tp.organizationName} (${tp.tpCode}) · ${tp.category}` : undefined],
                  ["Scheme", [batch.scheme, batch.schemeType].filter(Boolean).join(" · ")],
                  ["Job role", [batch.jobRole, batch.qpCode, batch.nsqfLevel ? `NSQF ${batch.nsqfLevel}` : null].filter(Boolean).join(" · ")],
                  ["Sector", batch.sector],
                  ["Centre", [batch.centreName, batch.centreAddress, batch.district, batch.state].filter(Boolean).join(", ")],
                  ["Training", batch.startDate ? `${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}` : undefined],
                  ["Assessment", [formatDate(batch.assessmentDate), batch.assessor ? `${batch.assessor.name} (${batch.assessor.assessorCode})` : null].filter(Boolean).join(" · ")],
                  ["Marks", `${batch.components.map((component) => `${component.label} ${component.max}`).join(" + ")} · pass ${batch.passPercent}%`],
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="candidates" className="mt-4">
          <CandidatesTab detail={data} locked={locked} />
        </TabsContent>
        <TabsContent value="assessment" className="mt-4">
          <AssessmentTab detail={data} locked={locked} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab detail={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
