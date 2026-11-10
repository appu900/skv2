"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Download, FileSpreadsheet, Pencil, Plus, Save, Send, Trash2, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { ToaBatch, ToaResultGrid, ToaTrainee } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendancePanel } from "./attendance-panel";
import { BatchFields, batchPayload } from "./batch-form";
import { BatchStatusBadge, CertificateStatusBadge, History } from "./labels";

type RosterTrainee = Exclude<ToaBatch["trainees"][number]["trainee"], string>;
const rosterOf = (batch: ToaBatch) => batch.trainees.map((entry) => entry.trainee).filter((trainee): trainee is RosterTrainee => typeof trainee === "object");

function RosterEditor({ batch }: { batch: ToaBatch }) {
  const eligible = useList<ToaTrainee>(`/toa/tp/assessors/eligible?batch=${batch._id}`);
  const current = rosterOf(batch);
  const [picked, setPicked] = useState<string[]>(current.map((trainee) => trainee._id));
  const save = useApiMutation(() => api.put(`/toa/tp/batches/${batch._id}/assessors`, { trainees: picked }), "Roster saved");
  const options = [...current, ...(eligible.data ?? []).filter((trainee) => !current.some((item) => item._id === trainee._id))];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Choose assessors</CardTitle>
        <CardDescription>
          Only your CUTM-approved assessors who are not in another open batch are listed. {picked.length}/{batch.capacity} selected.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {eligible.isLoading ? (
          <LoadingRows rows={3} />
        ) : options.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved assessors are free. Register assessors and wait for CUTM to approve them.</p>
        ) : (
          <div className="grid max-h-80 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
            {options.map((trainee) => (
              <label key={trainee._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={picked.includes(trainee._id)}
                  onChange={(event) => setPicked((list) => (event.target.checked ? [...list, trainee._id] : list.filter((id) => id !== trainee._id)))}
                />
                <span>
                  {trainee.name}
                  <span className="ml-1.5 text-xs text-muted-foreground">{trainee.registrationId}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        <Button size="sm" className="self-start" disabled={save.isPending || picked.length > batch.capacity} onClick={() => save.mutate(undefined)}>
          <Save />
          Save roster
        </Button>
      </CardContent>
    </Card>
  );
}

type SessionDraft = { date: string; startTime: string; endTime: string; topic: string };
function SessionPlanEditor({ batch }: { batch: ToaBatch }) {
  const [rows, setRows] = useState<SessionDraft[]>([]);
  useEffect(() => {
    setRows(batch.sessions.length ? batch.sessions.map((session) => ({ date: session.date.slice(0, 10), startTime: session.startTime ?? "", endTime: session.endTime ?? "", topic: session.topic ?? "" })) : [{ date: batch.startDate.slice(0, 10), startTime: "10:00", endTime: "17:00", topic: "" }]);
  }, [batch]);
  const save = useApiMutation(() => api.put(`/toa/tp/batches/${batch._id}/sessions`, { sessions: rows }), "Session plan saved");
  const update = (index: number, field: keyof SessionDraft, value: string) => setRows((list) => list.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session plan</CardTitle>
        <CardDescription>
          One row per training session between {formatDate(batch.startDate)} and {formatDate(batch.endDate)}. Attendance is recorded per session.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[9rem_6rem_6rem_1fr_auto]">
            <Input type="date" aria-label="Date" value={row.date} min={batch.startDate.slice(0, 10)} max={batch.endDate.slice(0, 10)} onChange={(event) => update(index, "date", event.target.value)} />
            <Input type="time" aria-label="Start" value={row.startTime} onChange={(event) => update(index, "startTime", event.target.value)} />
            <Input type="time" aria-label="End" value={row.endTime} onChange={(event) => update(index, "endTime", event.target.value)} />
            <Input placeholder="Topic" aria-label="Topic" value={row.topic} onChange={(event) => update(index, "topic", event.target.value)} />
            <Button variant="ghost" size="icon" aria-label="Remove session" onClick={() => setRows((list) => list.filter((_, i) => i !== index))}>
              <X />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRows((list) => [...list, { ...(list.at(-1) ?? { startTime: "10:00", endTime: "17:00" }), date: "", topic: "" } as SessionDraft])}>
            <Plus />
            Add session
          </Button>
          <Button size="sm" disabled={save.isPending || rows.length === 0 || rows.some((row) => !row.date)} onClick={() => save.mutate(undefined)}>
            <Save />
            Save plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PublishedResults({ batch }: { batch: ToaBatch }) {
  const { data, isLoading } = useItem<ToaResultGrid>(batch.resultsStatus === "published" ? `/toa/tp/batches/${batch._id}/results` : null);
  if (batch.resultsStatus !== "published") return <p className="text-sm text-muted-foreground">CUTM publishes results after the training and the payment are complete.</p>;
  if (isLoading || !data) return <LoadingRows />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Assessor</TableHead>
          <TableHead className="text-right">Attendance</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Certificate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.rows.map((row) => (
          <TableRow key={row.trainee._id}>
            <TableCell>
              <p className="font-medium">{row.trainee.name}</p>
              <p className="text-xs text-muted-foreground">{row.trainee.registrationId}</p>
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.attendancePercent ?? "—"}%</TableCell>
            <TableCell className="text-right tabular-nums">{row.result?.score ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={row.result?.result === "Pass" ? "success" : "destructive"}>{row.result?.result ?? "—"}</Badge>
              {row.result?.withheldReason && <p className="mt-1 max-w-56 text-xs text-muted-foreground">Withheld: {row.result.withheldReason}</p>}
            </TableCell>
            <TableCell>
              {row.certificate?.status === "valid" ? (
                <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/tp/certificates/${row.certificate?._id}/pdf`, `${row.trainee.registrationId}-certificate.pdf`)}>
                  <Download />
                  {row.certificate.certificateNumber}
                </Button>
              ) : row.certificate ? (
                <span className="text-sm">{row.certificate.certificateNumber}</span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
              {row.certificate && <CertificateStatusBadge status={row.certificate.status} />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ToaBatchDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: batch, isLoading } = useItem<ToaBatch>(`/toa/tp/batches/${id}`);
  const update = useApiMutation((body: Record<string, unknown>) => api.put(`/toa/tp/batches/${id}`, body), "Batch saved");
  const submit = useApiMutation(() => api.put(`/toa/tp/batches/${id}/submit`), "Batch submitted to CUTM");
  const remove = useApiMutation(() => api.delete(`/toa/tp/batches/${id}`), "Draft deleted");
  if (isLoading || !batch) return <LoadingRows rows={8} />;
  const editable = ["draft", "returned"].includes(batch.status);
  const roster = rosterOf(batch);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
        <Link href="/toa/batches">
          <ArrowLeft />
          All batches
        </Link>
      </Button>
      <PageHeader
        title={batch.programmeName}
        description={`${batch.batchCode} · ${batch.trainingMode} · ${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}${batch.submissionRef ? ` · Ref. ${batch.submissionRef}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BatchStatusBadge status={batch.status} />
            {editable && (
              <FormDialog
                wide
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil />
                    Edit details
                  </Button>
                }
                title="Edit batch details"
                onSubmit={(form) => update.mutateAsync(batchPayload(form))}
              >
                <BatchFields batch={batch} />
              </FormDialog>
            )}
            {editable && (
              <ConfirmDialog
                trigger={
                  <Button size="sm">
                    <Send />
                    Submit to CUTM
                  </Button>
                }
                title="Submit this batch to CUTM?"
                description="Details, assessors and sessions are checked, a submission reference is created and the batch is locked while CUTM reviews it."
                confirmLabel="Submit"
                onConfirm={() => submit.mutateAsync(undefined)}
              />
            )}
            {batch.status === "draft" && !batch.submissionRef && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 />
                    Delete
                  </Button>
                }
                title="Delete this draft batch?"
                confirmLabel="Delete"
                destructive
                onConfirm={async () => {
                  await remove.mutateAsync(undefined);
                  router.replace("/toa/batches");
                }}
              />
            )}
          </div>
        }
      />
      {batch.remarks && ["returned", "rejected"].includes(batch.status) && (
        <Alert className="border-warning/30 bg-warning/5">
          <AlertTitle>{batch.status === "returned" ? "Returned by CUTM for correction" : "Rejected by CUTM"}</AlertTitle>
          <AlertDescription>{batch.remarks}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={["approved", "completed"].includes(batch.status) ? "attendance" : "details"}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="assessors">Assessors ({roster.length})</TabsTrigger>
          <TabsTrigger value="sessions">Sessions ({batch.sessions.length})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">
            <Award />
            Results
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <DetailList
                  items={[
                    ["Programme", batch.programmeName],
                    ["Mode", batch.trainingMode],
                    ["Dates", `${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}`],
                    ["Capacity", `${roster.length} of ${batch.capacity}`],
                    ["Venue", batch.venue],
                    ["Meeting link", batch.meetingLink],
                    ["Trainer", [batch.trainerName, batch.trainerQualification].filter(Boolean).join(" · ")],
                    ["Trainer contact", [batch.trainerMobile, batch.trainerEmail].filter(Boolean).join(" · ")],
                    ["Schedule", batch.schedule],
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission history</CardTitle>
              </CardHeader>
              <CardContent>
                <History entries={batch.history} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="assessors" className="mt-4 flex flex-col gap-4">
          {editable ? (
            <RosterEditor batch={batch} />
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Assessor</TableHead>
                      <TableHead className="hidden sm:table-cell">Contact</TableHead>
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
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{trainee.mobile}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          <Button variant="outline" size="sm" className="self-start" onClick={() => downloadFile(`/toa/tp/batches/${batch._id}/roster.xlsx`, `${batch.batchCode}-roster.xlsx`)}>
            <FileSpreadsheet />
            Download roster (Excel)
          </Button>
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          {editable ? (
            <SessionPlanEditor batch={batch} />
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableBody>
                    {batch.sessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>{formatDate(session.date)}</TableCell>
                        <TableCell>{[session.startTime, session.endTime].filter(Boolean).join(" – ")}</TableCell>
                        <TableCell>{session.topic}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendancePanel batch={batch} mode="tp" />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <Card>
            <CardContent>
              <PublishedResults batch={batch} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
