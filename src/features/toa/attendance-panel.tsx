"use client";

import { useEffect, useState } from "react";
import { CheckCheck, Download, FileSpreadsheet, FileText, FileUp, Save, Send, Undo2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile, openPrivateFile } from "@/lib/api/download";
import type { AttendanceMark, AttendanceMatrix, ToaBatch, ToaSession } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SessionStatusBadge } from "./labels";

type Mode = "tp" | "admin";
const MARKS: AttendanceMark[] = ["present", "absent", "leave"];
const MARK_LABEL: Record<AttendanceMark, string> = { present: "Present", absent: "Absent", leave: "Leave" };
const sessionLabel = (session: ToaSession) => `${formatDate(session.date)}${session.startTime ? ` · ${session.startTime}${session.endTime ? `–${session.endTime}` : ""}` : ""}`;
const isFuture = (session: ToaSession) => new Date(session.date).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);

function SessionEditor({ batch, session, mode }: { batch: ToaBatch; session: ToaSession; mode: Mode }) {
  const base = mode === "tp" ? "/toa/tp" : "/toa/admin";
  const sessionPath = `${base}/batches/${batch._id}/sessions/${session._id}`;
  const { data, isLoading } = useItem<{ records: { trainee: string; status: AttendanceMark }[] }>(`${sessionPath}/attendance`);
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>({});
  useEffect(() => {
    if (data) setMarks(Object.fromEntries(data.records.map((record) => [record.trainee, record.status])));
  }, [data]);

  const editable = mode === "tp" && ["not_marked", "draft", "returned"].includes(session.attendanceStatus) && !isFuture(session);
  const save = useApiMutation(
    () => api.put(`${sessionPath}/attendance`, { records: Object.entries(marks).map(([trainee, status]) => ({ trainee, status })) }),
    "Attendance saved"
  );
  const submit = useApiMutation(() => api.put(`${sessionPath}/submit`), "Attendance sent to CUTM");
  const evidence = useApiMutation((form: FormData) => api.put(`${sessionPath}/evidence`, form), "Signed sheet uploaded");
  const approve = useApiMutation(() => api.put(`${sessionPath}/decision`, { decision: "approve" }), "Attendance approved");
  const giveBack = useApiMutation((remarks: string) => api.put(`${sessionPath}/decision`, { decision: "return", remarks }), "Attendance returned to the partner");

  const roster = batch.trainees.map((entry) => entry.trainee).filter((trainee): trainee is Exclude<typeof trainee, string> => typeof trainee === "object");
  const unmarked = roster.filter((trainee) => !marks[trainee._id]).length;
  const dirty = data ? roster.some((trainee) => marks[trainee._id] && data.records.find((record) => record.trainee === trainee._id)?.status !== marks[trainee._id]) : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {sessionLabel(session)}
          <SessionStatusBadge status={session.attendanceStatus} />
        </CardTitle>
        <CardDescription>{session.topic || "Session"}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {session.attendanceRemarks && session.attendanceStatus === "returned" && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertDescription>CUTM: {session.attendanceRemarks}</AlertDescription>
          </Alert>
        )}
        {mode === "tp" && isFuture(session) && <p className="text-sm text-muted-foreground">Attendance opens on the day of the session.</p>}
        {isLoading ? (
          <LoadingRows rows={4} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((trainee) => (
                <TableRow key={trainee._id}>
                  <TableCell>
                    <p className="font-medium">{trainee.name}</p>
                    <p className="text-xs text-muted-foreground">{trainee.registrationId}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? (
                      <div className="inline-flex rounded-lg border p-0.5" role="radiogroup" aria-label={`Attendance of ${trainee.name}`}>
                        {MARKS.map((mark) => (
                          <button
                            key={mark}
                            type="button"
                            role="radio"
                            aria-checked={marks[trainee._id] === mark}
                            onClick={() => setMarks((current) => ({ ...current, [trainee._id]: mark }))}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                              marks[trainee._id] === mark ? (mark === "present" ? "bg-success text-white" : mark === "absent" ? "bg-destructive text-white" : "bg-warning text-white") : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {MARK_LABEL[mark]}
                          </button>
                        ))}
                      </div>
                    ) : marks[trainee._id] ? (
                      <Badge variant={marks[trainee._id] === "present" ? "success" : marks[trainee._id] === "absent" ? "destructive" : "warning"}>{MARK_LABEL[marks[trainee._id]]}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <>
              <Button variant="outline" size="sm" onClick={() => setMarks(Object.fromEntries(roster.map((trainee) => [trainee._id, "present" as const])))}>
                <CheckCheck />
                All present
              </Button>
              <Button size="sm" onClick={() => save.mutate(undefined)} disabled={save.isPending || Object.keys(marks).length === 0}>
                <Save />
                Save
              </Button>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="secondary" disabled={unmarked > 0 || dirty || session.attendanceStatus === "not_marked"}>
                    <Send />
                    Submit to CUTM
                  </Button>
                }
                title="Submit this session's attendance?"
                description="It is locked once submitted. CUTM approves it or returns it for correction."
                confirmLabel="Submit"
                onConfirm={() => submit.mutateAsync(undefined)}
              />
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => downloadFile(`${sessionPath}/sheet.pdf`, `${batch.batchCode}-${session.date.slice(0, 10)}-attendance.pdf`)}>
            <FileText />
            Attendance sheet (PDF)
          </Button>
          {session.evidenceKey && (
            <Button variant="ghost" size="sm" onClick={() => openPrivateFile(mode === "tp" ? "/toa/tp/files" : "/toa/admin/files", session.evidenceKey as string)}>
              <Download />
              Signed sheet
            </Button>
          )}
          {mode === "admin" && session.attendanceStatus === "submitted" && (
            <ConfirmDialog
              trigger={
                <Button size="sm">
                  <CheckCheck />
                  Approve
                </Button>
              }
              title="Approve this session's attendance?"
              description="Approved attendance counts towards each assessor's eligibility for a certificate."
              confirmLabel="Approve"
              onConfirm={() => approve.mutateAsync(undefined)}
            />
          )}
          {mode === "admin" && ["submitted", "approved"].includes(session.attendanceStatus) && (
            <FormDialog
              trigger={
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Undo2 />
                  Return
                </Button>
              }
              title="Return this session to the partner?"
              description="They can correct and resubmit it."
              submitLabel="Return"
              onSubmit={(form) => giveBack.mutateAsync(String(form.get("remarks")).trim())}
            >
              <TextareaField label="Remarks" name="remarks" required rows={3} />
            </FormDialog>
          )}
        </div>
        {editable && (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              await evidence.mutateAsync(new FormData(formElement)).catch(() => {});
              formElement.reset();
            }}
          >
            <Input type="file" name="evidence" accept="image/jpeg,image/png,application/pdf" required className="max-w-64" />
            <Button type="submit" variant="outline" size="sm" disabled={evidence.isPending}>
              <FileUp />
              Upload signed sheet
            </Button>
            <span className="text-xs text-muted-foreground">Optional: the signed attendance sheet as evidence.</span>
          </form>
        )}
        {unmarked > 0 && editable && <p className="text-xs text-muted-foreground">{unmarked} assessor(s) still to mark; save, then submit when everyone is marked.</p>}
      </CardContent>
    </Card>
  );
}

export function AttendancePanel({ batch, mode }: { batch: ToaBatch; mode: Mode }) {
  const base = mode === "tp" ? "/toa/tp" : "/toa/admin";
  const [selected, setSelected] = useState<string | null>(null);
  const matrix = useItem<AttendanceMatrix>(`${base}/batches/${batch._id}/attendance`);
  const session = batch.sessions.find((item) => item._id === selected) ?? batch.sessions.find((item) => !["approved"].includes(item.attendanceStatus) && !isFuture(item)) ?? batch.sessions[0];

  if (!["approved", "completed"].includes(batch.status)) {
    return <p className="text-sm text-muted-foreground">Attendance opens once CUTM approves the batch.</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-1">
          {batch.sessions.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => setSelected(item._id)}
              className={cn("flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted", item._id === session?._id && "border-primary bg-primary/5")}
            >
              <span>
                <span className="block font-medium">{sessionLabel(item)}</span>
                <span className="block text-xs text-muted-foreground">{item.topic || "Session"}</span>
              </span>
              <SessionStatusBadge status={item.attendanceStatus} />
            </button>
          ))}
        </div>
        {session && <SessionEditor key={session._id} batch={batch} session={session} mode={mode} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance summary</CardTitle>
          <CardDescription>Percent over sessions CUTM has approved ({matrix.data?.approvedSessions ?? 0} of {batch.sessions.length}).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {matrix.isLoading || !matrix.data ? (
            <LoadingRows rows={3} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessor</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.data.trainees.map((row) => (
                  <TableRow key={row.trainee._id}>
                    <TableCell>
                      {row.trainee.name}
                      <span className="ml-2 text-xs text-muted-foreground">{row.trainee.registrationId}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.present}/{matrix.data?.approvedSessions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.percent === null ? "—" : `${row.percent}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Button variant="outline" size="sm" className="self-start" onClick={() => downloadFile(`${base}/batches/${batch._id}/attendance.xlsx`, `${batch.batchCode}-attendance.xlsx`)}>
            <FileSpreadsheet />
            Export to Excel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
