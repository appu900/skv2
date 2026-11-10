"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CheckCheck, Download, FileSearch, FileSpreadsheet, FileText, Layers, Megaphone, Save, Undo2, Upload, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { BatchStatus, ToaBatch, ToaInvoice, ToaResultGrid } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendancePanel } from "@/features/toa/attendance-panel";
import { BatchStatusBadge, CertificateStatusBadge, History, MoneyStatusBadge, tpName } from "@/features/toa/labels";

type Tab = "review" | "running" | "completed" | "all";
const TAB_OF: Record<BatchStatus, Exclude<Tab, "all">> = { submitted: "review", under_review: "review", approved: "running", completed: "completed", draft: "review", returned: "review", rejected: "completed" };

export function ToaAdminBatchesPage() {
  const [tab, setTab] = useState<Tab>("review");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaBatch>("/toa/admin/batches");
  const listed = data.filter((batch) => !["draft"].includes(batch.status));
  const inTab = (batch: ToaBatch, value: Tab) => value === "all" || (value === "review" ? ["submitted", "under_review"].includes(batch.status) : TAB_OF[batch.status] === value);
  const rows = listed.filter((batch) => inTab(batch, tab) && matches(search, batch.batchCode, batch.programmeName, tpName(batch.toaTpId), batch.submissionRef ?? ""));
  return (
    <>
      <PageHeader title="ToA batches" description="Review submitted batches, approve attendance session by session, then enter, approve and publish results." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "review", label: "To review", count: listed.filter((batch) => inTab(batch, "review")).length },
                { value: "running", label: "Running", count: listed.filter((batch) => inTab(batch, "running")).length },
                { value: "completed", label: "Closed", count: listed.filter((batch) => inTab(batch, "completed")).length },
                { value: "all", label: "All", count: listed.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search batch, partner, reference…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Layers} title="Nothing here" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Dates</TableHead>
                <TableHead className="hidden sm:table-cell">Assessors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <p className="font-medium">{batch.programmeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.batchCode}
                      {batch.submissionRef ? ` · ${batch.submissionRef}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tpName(batch.toaTpId)}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{batch.trainees.length}</TableCell>
                  <TableCell>
                    <BatchStatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/toa/batches/${batch._id}`}>Open</Link>
                    </Button>
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

function BatchDecision({ batch, decision }: { batch: ToaBatch; decision: "return" | "reject" }) {
  const decide = useApiMutation((remarks: string) => api.put(`/toa/admin/batches/${batch._id}/decision`, { decision, remarks }), decision === "return" ? "Batch returned for correction" : "Batch rejected");
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm" className={decision === "reject" ? "text-destructive hover:text-destructive" : undefined}>
          {decision === "return" ? <Undo2 /> : <XCircle />}
          {decision === "return" ? "Return" : "Reject"}
        </Button>
      }
      title={decision === "return" ? "Return this batch for correction?" : "Reject this batch?"}
      description={decision === "return" ? "The partner can edit and resubmit it." : "This is final; the assessors become free for another batch."}
      submitLabel={decision === "return" ? "Return" : "Reject"}
      onSubmit={(form) => decide.mutateAsync(String(form.get("remarks")).trim())}
    >
      <TextareaField label="Remarks for the training partner" name="remarks" required rows={3} />
    </FormDialog>
  );
}

type Entry = { score: string; absent: boolean; remarks: string };
function ResultsPanel({ batch }: { batch: ToaBatch }) {
  const base = `/toa/admin/batches/${batch._id}`;
  const { data, isLoading } = useItem<ToaResultGrid>(["approved", "completed"].includes(batch.status) ? `${base}/results` : null);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  useEffect(() => {
    if (data) setEntries(Object.fromEntries(data.rows.map((row) => [row.trainee._id, { score: row.result && row.result.result !== "Absent" ? String(row.result.score) : "", absent: row.result?.result === "Absent", remarks: row.result?.remarks ?? "" }])));
  }, [data]);
  const save = useApiMutation(
    () => api.put(`${base}/results`, { entries: Object.entries(entries).filter(([, entry]) => entry.absent || entry.score !== "").map(([trainee, entry]) => ({ trainee, score: Number(entry.score), absent: entry.absent, remarks: entry.remarks })) }),
    "Results saved as draft"
  );
  const importFile = useApiMutation((form: FormData) => api.post(`${base}/results/import`, form), "Results imported");
  const approve = useApiMutation(() => api.put(`${base}/results/approve`), "Results approved");
  const publish = useApiMutation(() => api.put<{ data: { issued: number; assessors: number } }>(`${base}/results/publish`), (response) => `Published: ${response.data.data.issued} certificate(s) for ${response.data.data.assessors} assessor(s)`);

  if (!["approved", "completed"].includes(batch.status)) return <p className="text-sm text-muted-foreground">Results can be entered once the batch is approved.</p>;
  if (isLoading || !data) return <LoadingRows />;
  const published = data.batch.resultsStatus === "published";
  const eligible = data.rows.filter((row) => row.eligible).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">Pass mark {data.settings.passMark}</Badge>
        <Badge variant="outline">Min. attendance {data.settings.minAttendancePercent}%</Badge>
        <Badge variant={data.invoice?.status === "paid" ? "success" : "warning"}>Fee {data.invoice?.status ?? "not invoiced"}</Badge>
        <Badge variant={data.allSessionsApproved ? "success" : "warning"}>{data.allSessionsApproved ? "All attendance approved" : "Attendance not fully approved"}</Badge>
        <Badge variant="secondary">Results: {data.batch.resultsStatus.replace("_", " ")}</Badge>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => {
                const entry = entries[row.trainee._id] ?? { score: "", absent: false, remarks: "" };
                const set = (patch: Partial<Entry>) => setEntries((current) => ({ ...current, [row.trainee._id]: { ...entry, ...patch } }));
                return (
                  <TableRow key={row.trainee._id}>
                    <TableCell>
                      <p className="font-medium">{row.trainee.name}</p>
                      <p className="text-xs text-muted-foreground">{row.trainee.registrationId}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.attendancePercent === null ? "—" : `${row.attendancePercent}%`}</TableCell>
                    <TableCell>
                      {published ? (
                        <span className="tabular-nums">{row.result?.score ?? "—"}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input type="number" min={0} max={100} step="0.5" className="w-20" aria-label="Score" value={entry.score} disabled={entry.absent} onChange={(event) => set({ score: event.target.value })} />
                          <label className="flex items-center gap-1 text-xs text-muted-foreground">
                            <input type="checkbox" className="accent-primary" checked={entry.absent} onChange={(event) => set({ absent: event.target.checked })} />
                            Absent
                          </label>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.result ? <Badge variant={row.result.result === "Pass" ? "success" : "destructive"}>{row.result.result}</Badge> : <span className="text-sm text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {row.certificate ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {row.certificate.status === "valid" ? (
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/admin/certificates/${row.certificate?._id}/pdf`, `${row.trainee.registrationId}-certificate.pdf`)}>
                              <Download />
                              {row.certificate.certificateNumber}
                            </Button>
                          ) : (
                            <span className="text-sm">{row.certificate.certificateNumber}</span>
                          )}
                          <CertificateStatusBadge status={row.certificate.status} />
                        </div>
                      ) : published ? (
                        <p className="max-w-64 text-xs text-muted-foreground">{row.result?.withheldReason ? `Withheld: ${row.result.withheldReason}` : `No certificate (${row.result?.result ?? "no result"})`}</p>
                      ) : row.eligible ? (
                        <Badge variant="success">Eligible</Badge>
                      ) : (
                        <p className="max-w-64 text-xs text-muted-foreground">{row.blockers.join("; ")}</p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {!published && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
            <Save />
            Save results
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile(`${base}/results/template.xlsx`, `${batch.batchCode}-results.xlsx`)}>
            <FileSpreadsheet />
            Download template
          </Button>
          <FormDialog
            trigger={
              <Button variant="outline" size="sm">
                <Upload />
                Import filled template
              </Button>
            }
            title="Import results from Excel"
            description="Use the downloaded template. Every row is checked first; if any row is wrong nothing is saved and the errors are listed."
            submitLabel="Import"
            onSubmit={(form) => importFile.mutateAsync(form)}
          >
            <Input type="file" name="file" accept=".xlsx" required />
          </FormDialog>
          <ConfirmDialog
            trigger={
              <Button variant="secondary" size="sm" disabled={data.batch.resultsStatus !== "draft"}>
                <CheckCheck />
                Approve results
              </Button>
            }
            title="Approve these results?"
            description="Approved results can be published. Changing any score afterwards needs a fresh approval."
            confirmLabel="Approve"
            onConfirm={() => approve.mutateAsync(undefined)}
          />
          <ConfirmDialog
            trigger={
              <Button size="sm" disabled={data.batch.resultsStatus !== "approved"}>
                <Megaphone />
                Publish
              </Button>
            }
            title="Publish results and issue certificates?"
            description={`${eligible} of ${data.rows.length} assessor(s) meet every rule and get a certificate now. The others see their result with the reason. This cannot be undone; later corrections go through certificate reissue.`}
            confirmLabel="Publish"
            onConfirm={() => publish.mutateAsync(undefined)}
          />
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ batch }: { batch: ToaBatch }) {
  const { data } = useList<ToaInvoice>(`/toa/admin/invoices`);
  const invoice = data?.find((item) => item.batch?._id === batch._id && item.status !== "cancelled");
  if (!invoice) return <p className="text-sm text-muted-foreground">The invoice is raised when the batch is approved.</p>;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="font-medium">{invoice.invoiceNumber}</span>
      <span className="tabular-nums">{formatCurrency(invoice.total)}</span>
      <MoneyStatusBadge status={invoice.status} />
      <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/admin/invoices/${invoice._id}/pdf`, `${invoice.invoiceNumber.replaceAll("/", "-")}.pdf`)}>
        <FileText />
        Invoice PDF
      </Button>
    </div>
  );
}

export function ToaAdminBatchDetailPage({ id }: { id: string }) {
  const { data: batch, isLoading } = useItem<ToaBatch>(`/toa/admin/batches/${id}`);
  const review = useApiMutation(() => api.put(`/toa/admin/batches/${id}/review`), "Taken up for review");
  const approve = useApiMutation(() => api.put(`/toa/admin/batches/${id}/decision`, { decision: "approve" }), "Batch approved; the invoice is raised");
  if (isLoading || !batch) return <LoadingRows rows={8} />;
  const roster = batch.trainees.map((entry) => entry.trainee).filter((trainee): trainee is Exclude<typeof trainee, string> => typeof trainee === "object");
  const deciding = ["submitted", "under_review"].includes(batch.status);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
        <Link href="/admin/toa/batches">
          <ArrowLeft />
          All ToA batches
        </Link>
      </Button>
      <PageHeader
        title={batch.programmeName}
        description={`${batch.batchCode} · ${tpName(batch.toaTpId)} · ${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}${batch.submissionRef ? ` · Ref. ${batch.submissionRef}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BatchStatusBadge status={batch.status} />
            {batch.status === "submitted" && (
              <Button variant="outline" size="sm" onClick={() => review.mutate(undefined)}>
                <FileSearch />
                Start review
              </Button>
            )}
            {deciding && (
              <>
                <ConfirmDialog
                  trigger={
                    <Button size="sm">
                      <BadgeCheck />
                      Approve
                    </Button>
                  }
                  title="Approve this batch?"
                  description={`${roster.length} assessor(s), ${batch.sessions.length} session(s). The batch is locked, attendance opens and the invoice is raised for the partner.`}
                  confirmLabel="Approve"
                  onConfirm={() => approve.mutateAsync(undefined)}
                />
                <BatchDecision batch={batch} decision="return" />
                <BatchDecision batch={batch} decision="reject" />
              </>
            )}
          </div>
        }
      />
      {batch.remarks && (
        <Alert>
          <AlertDescription>Last remarks: {batch.remarks}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue={deciding ? "details" : "attendance"}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="assessors">Assessors ({roster.length})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <DetailList
                  items={[
                    ["Training partner", tpName(batch.toaTpId)],
                    ["Mode", batch.trainingMode],
                    ["Capacity", `${roster.length} of ${batch.capacity}`],
                    ["Venue", batch.venue],
                    ["Meeting link", batch.meetingLink],
                    ["Trainer", [batch.trainerName, batch.trainerQualification].filter(Boolean).join(" · ")],
                    ["Trainer contact", [batch.trainerMobile, batch.trainerEmail].filter(Boolean).join(" · ")],
                    ["Schedule", batch.schedule],
                    ["Sessions", batch.sessions.map((session) => formatDate(session.date)).join(", ")],
                  ]}
                />
                <InvoiceCard batch={batch} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission history</CardTitle>
                <CardDescription>Every submission and decision.</CardDescription>
              </CardHeader>
              <CardContent>
                <History entries={batch.history} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="assessors" className="mt-4">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Assessor</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((trainee, index) => (
                    <TableRow key={trainee._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {trainee.name}
                        <span className="ml-2 text-xs text-muted-foreground">{trainee.registrationId}</span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {trainee.mobile} · {trainee.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trainee.status === "approved" ? "success" : "warning"}>{trainee.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendancePanel batch={batch} mode="admin" />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <ResultsPanel batch={batch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
