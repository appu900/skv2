"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCheck, Eye, X } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ApplicationStatus, AssessmentAgency } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { Field } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = ApplicationStatus | "All";

function AgencySheet({ aa }: { aa: AssessmentAgency }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          View
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{aa.agencyName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ApplicationStatusBadge status={aa.applicationStatus} />
            {aa.applicationStatus === "Approved" && <Badge variant="outline">{aa.paymentPercentage ?? 0}% share</Badge>}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Agency</h3>
            <DetailList
              items={[
                ["Head of organisation", aa.headOfTheOrganization],
                ["Legal status", aa.legalStatusOfTheOrganization],
                ["PAN", aa.COMPANY_PAN_NO],
                ["GST", aa.COMPANY_GST_NO],
                ["Branches", aa.NO_OF_BRANCHES],
                ["Certified assessors", aa.total_no_of_certified_Assessor],
                ["Region", [aa.geographical_region, aa.state_Under_geographicalRegion].filter(Boolean).join(" · ")],
                ["Website", aa.websiteLink],
                ["Applied", formatDate(aa.createdAt)],
              ]}
            />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Contact</h3>
            <DetailList
              items={[
                ["Email", aa.email],
                ["Phone", aa.phoneNumber],
                ["Office address", aa.officeAddress],
                ["Communication address", aa.communicationAddress],
                ["SPOC", aa.SPOC_NAME],
                ["SPOC contact", [aa.SPOC_CONTACT_NO, aa.SPOC_EMAIL].filter(Boolean).join(" · ")],
              ]}
            />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Bank details</h3>
            <DetailList
              items={[
                ["Bank", aa.BankName],
                ["Branch", aa.BranchName],
                ["Account number", aa.AccountNumber],
                ["IFSC", aa.IFSC_Code],
              ]}
            />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Documents</h3>
            <div className="flex flex-wrap gap-4">
              <FileLink href={aa.LETTER_OF_NCVET} label="NCVET letter" />
              <FileLink href={aa.logo} label="Logo" />
            </div>
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Sectors & courses</h3>
            <div className="flex flex-wrap gap-1.5">
              {aa.sectors?.map((sector) => <Badge key={`s-${sector}`}>{sector}</Badge>)}
              {aa.courses?.map((course) => (
                <Badge key={`c-${course}`} variant="outline">
                  {course}
                </Badge>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ApproveDialog({ aa }: { aa: AssessmentAgency }) {
  const approve = useApiMutation(
    (percentage: number) => api.put(`/aa/approve/${aa._id}`, { percentage }),
    `${aa.agencyName} approved`
  );
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Check />
          Approve
        </Button>
      }
      title={`Approve ${aa.agencyName}`}
      description="The agency's invoice is this percentage of the per-candidate fee for every assessed candidate."
      submitLabel="Approve"
      onSubmit={(form) => approve.mutateAsync(Number(form.get("percentage")))}
    >
      <Field label="Payment share (%)" name="percentage" type="number" min={0} max={100} step="0.01" required placeholder="e.g. 40" />
    </FormDialog>
  );
}

export function AssessmentAgenciesPage() {
  const [tab, setTab] = useState<Tab>("Pending");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<AssessmentAgency>("/aa");
  const reject = useApiMutation((id: string) => api.put(`/aa/reject/${id}`), "Application rejected");

  const counts = useMemo(
    () => ({
      Pending: data.filter((aa) => aa.applicationStatus === "Pending").length,
      Approved: data.filter((aa) => aa.applicationStatus === "Approved").length,
      Rejected: data.filter((aa) => aa.applicationStatus === "Rejected").length,
      All: data.length,
    }),
    [data]
  );

  const rows = data
    .filter((aa) => tab === "All" || aa.applicationStatus === tab)
    .filter((aa) => matches(search, aa.agencyName, aa.email, aa.state_Under_geographicalRegion));

  return (
    <>
      <PageHeader title="Assessment agencies" description="Review agencies, approve them and set their payment share." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={(["Pending", "Approved", "Rejected", "All"] as Tab[]).map((value) => ({ value, label: value, count: counts[value] }))}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, email…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No assessment agencies" description="Nothing matches this filter." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Share</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden xl:table-cell">Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((aa) => (
                <TableRow key={aa._id}>
                  <TableCell>
                    <p className="font-medium">{aa.agencyName}</p>
                    <p className="text-xs text-muted-foreground">{aa.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{aa.phoneNumber || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {aa.applicationStatus === "Approved" ? `${aa.paymentPercentage ?? 0}%` : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <ApplicationStatusBadge status={aa.applicationStatus} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(aa.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <AgencySheet aa={aa} />
                      {aa.applicationStatus === "Pending" && (
                        <>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <X />
                                Reject
                              </Button>
                            }
                            title={`Reject ${aa.agencyName}?`}
                            description="The agency will not be able to receive exams."
                            confirmLabel="Reject"
                            destructive
                            onConfirm={() => reject.mutateAsync(aa._id)}
                          />
                          <ApproveDialog aa={aa} />
                        </>
                      )}
                    </div>
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
