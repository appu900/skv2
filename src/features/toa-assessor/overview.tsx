"use client";

import { Award, CalendarDays, Download, MapPin, Video } from "lucide-react";
import { downloadFile } from "@/lib/api/download";
import type { ToaTrainee } from "@/lib/api/toa";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NotificationList } from "@/features/toa/notifications";
import { tpName } from "@/features/toa/labels";

interface Overview {
  profile: ToaTrainee;
  batches: {
    _id: string;
    batchCode: string;
    programmeName: string;
    trainingMode: string;
    startDate: string;
    endDate: string;
    venue?: string;
    meetingLink?: string;
    status: string;
    resultsStatus: string;
    sessions: { _id: string; date: string; startTime?: string; endTime?: string; topic?: string; approved: boolean; status: "present" | "absent" | "leave" | null }[];
    attendancePercent: number | null;
    result: { score: number; result: string; status: string; withheldReason?: string | null } | null;
    certificate: { _id: string; certificateNumber: string; issueDate: string; verifyCode: string } | null;
  }[];
}

const MARK = { present: ["Present", "success"], absent: ["Absent", "destructive"], leave: ["Leave", "warning"] } as const;

export function AssessorOverviewPage() {
  const { data, isLoading } = useItem<Overview>("/toa/assessor/overview");
  if (isLoading || !data) return <LoadingRows rows={6} />;
  return (
    <>
      <DashboardHeader subtitle={`${data.profile.registrationId} · registered by ${tpName(data.profile.toaTpId)}`} />
      {data.batches.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={CalendarDays} title="No batch yet" description="Your training partner will add you to a batch; it appears here once CUTM approves it." />
          </CardContent>
        </Card>
      ) : (
        data.batches.map((batch) => (
          <div key={batch._id} className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{batch.programmeName}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{batch.batchCode}</span>
                  <span>
                    {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </span>
                  {batch.venue && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {batch.venue}
                    </span>
                  )}
                  {batch.meetingLink && (
                    <a href={batch.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Video className="size-3.5" />
                      Join online
                    </a>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead className="hidden sm:table-cell">Topic</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.sessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          {formatDate(session.date)}
                          <span className="ml-2 text-xs text-muted-foreground">{[session.startTime, session.endTime].filter(Boolean).join("–")}</span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{session.topic}</TableCell>
                        <TableCell className="text-right">
                          {session.status ? <Badge variant={MARK[session.status][1]}>{MARK[session.status][0]}</Badge> : <span className="text-xs text-muted-foreground">{session.approved ? "—" : "Not confirmed yet"}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="size-4" />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Attendance (confirmed sessions)</p>
                  <p className="text-2xl font-semibold tabular-nums">{batch.attendancePercent === null ? "—" : `${batch.attendancePercent}%`}</p>
                </div>
                {batch.result ? (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-2xl font-semibold tabular-nums">{batch.result.score}</p>
                    <Badge variant={batch.result.result === "Pass" ? "success" : "destructive"}>{batch.result.result}</Badge>
                    {batch.result.withheldReason && <p className="mt-2 text-xs text-muted-foreground">Certificate withheld: {batch.result.withheldReason}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Your result appears here when CUTM publishes it.</p>
                )}
                {batch.certificate && (
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => downloadFile(`/toa/assessor/certificates/${batch.certificate?._id}/pdf`, `${data.profile.registrationId}-certificate.pdf`)}>
                      <Download />
                      Download certificate
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {batch.certificate.certificateNumber} · issued {formatDate(batch.certificate.issueDate)} ·{" "}
                      <a className="underline-offset-4 hover:underline" href={`/verify/toa/${batch.certificate.verifyCode}`} target="_blank" rel="noreferrer">
                        verification page
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList base="/toa/assessor" limit={5} />
        </CardContent>
      </Card>
    </>
  );
}
