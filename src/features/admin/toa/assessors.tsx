"use client";

import { useState } from "react";
import { BadgeCheck, Eye, FileSearch, Undo2, UserRound, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { openPrivateFile } from "@/lib/api/download";
import type { ToaTrainee, TraineeStatus } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TraineeStatusBadge, tpName } from "@/features/toa/labels";

type Tab = "pending" | "correction_required" | "approved" | "rejected" | "all";
const DOCS: [keyof ToaTrainee["documents"], string][] = [
  ["photo", "Photograph"],
  ["idProof", "Identity proof"],
  ["qualificationCertificate", "Qualification certificate"],
  ["experienceProof", "Experience proof"],
];

function Decision({ trainee, decision }: { trainee: ToaTrainee; decision: "return" | "reject" }) {
  const decide = useApiMutation((remarks: string) => api.put(`/toa/admin/assessors/${trainee._id}/decision`, { decision, remarks }), decision === "return" ? "Returned for correction" : "Application rejected");
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm" className={decision === "reject" ? "text-destructive hover:text-destructive" : undefined}>
          {decision === "return" ? <Undo2 /> : <XCircle />}
          {decision === "return" ? "Return for correction" : "Reject"}
        </Button>
      }
      title={decision === "return" ? `Return ${trainee.name}'s application?` : `Reject ${trainee.name}?`}
      description={decision === "return" ? "The training partner sees your remarks, corrects the application and submits it again." : "This is final. The training partner sees your remarks."}
      submitLabel={decision === "return" ? "Return" : "Reject"}
      onSubmit={(form) => decide.mutateAsync(String(form.get("remarks")).trim())}
    >
      <TextareaField label="Remarks for the training partner" name="remarks" required rows={3} />
    </FormDialog>
  );
}

function ApplicationSheet({ trainee }: { trainee: ToaTrainee }) {
  const review = useApiMutation(() => api.put(`/toa/admin/assessors/${trainee._id}/review`), "Taken up for review");
  const approve = useApiMutation(() => api.put(`/toa/admin/assessors/${trainee._id}/decision`, { decision: "approve" }), `${trainee.name} approved`);
  const portal = useApiMutation((enabled: boolean) => api.put(`/toa/admin/assessors/${trainee._id}/portal`, { enabled }), "Portal access updated");
  const open = ["submitted", "under_review"].includes(trainee.status);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          Review
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{trainee.name}</SheetTitle>
          <SheetDescription>
            {trainee.registrationId} · {tpName(trainee.toaTpId)}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <TraineeStatusBadge status={trainee.status} />
            {trainee.status === "approved" && <Badge variant={trainee.portalEnabled ? "success" : "outline"}>{trainee.portalEnabled ? (trainee.hasPassword ? "Portal active" : "Portal invited") : "Portal off"}</Badge>}
          </div>
          {open && (
            <div className="flex flex-wrap gap-2">
              {trainee.status === "submitted" && (
                <Button variant="outline" size="sm" onClick={() => review.mutate(undefined)}>
                  <FileSearch />
                  Start review
                </Button>
              )}
              <ConfirmDialog
                trigger={
                  <Button size="sm">
                    <BadgeCheck />
                    Approve
                  </Button>
                }
                title={`Approve ${trainee.name}?`}
                description="The training partner can then add them to a batch. If the assessor portal is on, they get an email to set a password."
                confirmLabel="Approve"
                onConfirm={() => approve.mutateAsync(undefined)}
              />
              <Decision trainee={trainee} decision="return" />
              <Decision trainee={trainee} decision="reject" />
            </div>
          )}
          {trainee.status === "approved" && (
            <Button variant="outline" size="sm" className="self-start" onClick={() => portal.mutate(!trainee.portalEnabled)}>
              {trainee.portalEnabled ? "Switch off portal access" : "Switch on portal access"}
            </Button>
          )}
          {trainee.remarks && <p className="rounded-lg border bg-muted/40 p-3 text-sm">Last remarks: {trainee.remarks}</p>}
          <DetailList
            items={[
              ["Email", trainee.email],
              ["Mobile", trainee.mobile],
              ["Date of birth", formatDate(trainee.dob)],
              ["Gender", trainee.gender],
              ["Qualification", trainee.qualification],
              ["Experience", trainee.experienceYears !== undefined ? `${trainee.experienceYears} years` : undefined],
              ["Sector", trainee.sector],
              ["Organisation", [trainee.currentOrganisation, trainee.designation].filter(Boolean).join(" · ")],
              ["Address", [trainee.address, trainee.state].filter(Boolean).join(", ")],
              ["ID proof", trainee.idProofType ? `${trainee.idProofType} ${trainee.idProofNumber ?? ""}` : undefined],
              ["Submitted", formatDate(trainee.submittedAt)],
            ]}
          />
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Documents</h3>
            <div className="flex flex-wrap gap-2">
              {DOCS.map(([key, label]) =>
                trainee.documents?.[key] ? (
                  <Button key={key} variant="outline" size="sm" onClick={() => openPrivateFile("/toa/admin/files", trainee.documents[key] as string)}>
                    {label}
                  </Button>
                ) : (
                  <Badge key={key} variant="outline">
                    {label}: not uploaded
                  </Badge>
                )
              )}
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">History</h3>
            <History entries={trainee.history} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ToaAssessorApplicationsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaTrainee>("/toa/admin/assessors");
  const listed = data.filter((trainee) => trainee.status !== "draft");
  const inTab = (trainee: ToaTrainee, value: Tab) => value === "all" || (value === "pending" ? (["submitted", "under_review"] as TraineeStatus[]).includes(trainee.status) : trainee.status === value);
  const rows = listed.filter((trainee) => inTab(trainee, tab) && matches(search, trainee.name, trainee.registrationId, trainee.email, tpName(trainee.toaTpId)));
  const count = (value: Tab) => listed.filter((trainee) => inTab(trainee, value)).length;

  return (
    <>
      <PageHeader title="Assessor applications" description="Assessors registered by RailTel ToA training partners. Verify details and documents, then approve, return with remarks or reject." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "pending", label: "To verify", count: count("pending") },
                { value: "correction_required", label: "With partner", count: count("correction_required") },
                { value: "approved", label: "Approved", count: count("approved") },
                { value: "rejected", label: "Rejected", count: count("rejected") },
                { value: "all", label: "All", count: count("all") },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID, partner…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={UserRound} title="Nothing here" description="Submitted applications appear in “To verify”." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((trainee) => (
                <TableRow key={trainee._id}>
                  <TableCell>
                    <p className="font-medium">{trainee.name}</p>
                    <p className="text-xs text-muted-foreground">{trainee.registrationId}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tpName(trainee.toaTpId)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{trainee.experienceYears !== undefined ? `${trainee.experienceYears} yrs · ${trainee.qualification ?? ""}` : "—"}</TableCell>
                  <TableCell>
                    <TraineeStatusBadge status={trainee.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(trainee.submittedAt)}</TableCell>
                  <TableCell className="text-right">
                    <ApplicationSheet trainee={trainee} />
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
