"use client";

import { useMemo, useState } from "react";
import { Building2, Check, Eye, X } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ApplicationStatus, TrainingPartner } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatCurrency, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { Field } from "@/components/shared/field";
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

function TrainingPartnerSheet({ tp }: { tp: TrainingPartner }) {
  const toggleEdit = useApiMutation(
    () => api.put(`/tp/${tp._id}`, { editPermission: !tp.editPermission }),
    tp.editPermission ? "Edit permission revoked" : "Edit permission granted"
  );
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
          <SheetTitle>{tp.organizationName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ApplicationStatusBadge status={tp.applicationStatus} />
            {tp.tpCode && <Badge variant="outline">{tp.tpCode}</Badge>}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Organisation</h3>
            <DetailList
              items={[
                ["Category", tp.organizationCategory],
                ["Scheme", tp.scheme],
                ["Corporate fee / candidate", tp.organizationCorporatePaymentFee ? formatCurrency(tp.organizationCorporatePaymentFee) : null],
                ["PAN", tp.pan],
                ["GST", tp.registeredOfficeGst],
                ["PRN", tp.prnNo],
                ["Website", tp.website],
                ["Applied", formatDate(tp.createdAt)],
              ]}
            />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Registered office</h3>
            <DetailList
              items={[
                ["Address", [tp.registeredOfficeAddress, tp.registeredOfficeCity, tp.registeredOfficeDist, tp.registeredOfficePin].filter(Boolean).join(", ")],
                ["State", tp.registeredOfficeState],
                ["Email", tp.registeredOfficeEmail],
                ["Mobile", tp.registeredOfficeMobile],
              ]}
            />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">People</h3>
            <DetailList
              items={[
                ["Head / owner", tp.headOwnerName],
                ["Owner contact", [tp.headOwnerMobile, tp.headOwnerEmail].filter(Boolean).join(" · ")],
                ["Project contact", tp.projectContactPersonName],
                ["Project contact details", [tp.projectContactPersonMobile, tp.projectContactPersonEmail].filter(Boolean).join(" · ")],
              ]}
            />
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Sectors & courses</h3>
            <div className="flex flex-wrap gap-1.5">
              {[...(tp.sector ?? []), ...(tp.courses ?? [])].length === 0 && (
                <span className="text-sm text-muted-foreground">None added</span>
              )}
              {tp.sector?.map((sector) => <Badge key={`s-${sector}`}>{sector}</Badge>)}
              {tp.courses?.map((course) => (
                <Badge key={`c-${course}`} variant="outline">
                  {course}
                </Badge>
              ))}
            </div>
          </section>
          <Separator />
          <section className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Profile edit permission</p>
              <p className="text-xs text-muted-foreground">
                {tp.editPermission ? "The training partner can edit its profile." : "Profile is locked for editing."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toggleEdit.mutate(undefined)} disabled={toggleEdit.isPending}>
              {tp.editPermission ? "Revoke" : "Grant"}
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ApproveDialog({ tp }: { tp: TrainingPartner }) {
  const approve = useApiMutation(
    (amount: number) => api.put(`/tp/approve/${tp._id}`, { amount }),
    `${tp.organizationName} approved`
  );
  const corporate = tp.scheme === "Corporate";
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Check />
          Approve
        </Button>
      }
      title={`Approve ${tp.organizationName}`}
      description={
        corporate
          ? "Corporate training partners pay a fee per candidate. GST (18%) is added when a batch is submitted."
          : "Government scheme partners pay the scheme price, so no fee is needed here."
      }
      submitLabel="Approve"
      onSubmit={(form) => approve.mutateAsync(Number(form.get("amount") || 0))}
    >
      {corporate && (
        <Field label="Fee per candidate (₹)" name="amount" type="number" min={1} step="1" required placeholder="e.g. 1500" />
      )}
    </FormDialog>
  );
}

export function TrainingPartnersPage() {
  const [tab, setTab] = useState<Tab>("Pending");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<TrainingPartner>("/tp");
  const reject = useApiMutation((id: string) => api.put(`/tp/reject/${id}`), "Application rejected");

  const counts = useMemo(
    () => ({
      Pending: data.filter((tp) => tp.applicationStatus === "Pending").length,
      Approved: data.filter((tp) => tp.applicationStatus === "Approved").length,
      Rejected: data.filter((tp) => tp.applicationStatus === "Rejected").length,
      All: data.length,
    }),
    [data]
  );

  const rows = data
    .filter((tp) => tab === "All" || tp.applicationStatus === tab)
    .filter((tp) => matches(search, tp.organizationName, tp.registeredOfficeEmail, tp.registeredOfficeState, tp.scheme, tp.tpCode));

  return (
    <>
      <PageHeader title="Training partners" description="Review applications, approve partners and set corporate fees." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={(["Pending", "Approved", "Rejected", "All"] as Tab[]).map((value) => ({ value, label: value, count: counts[value] }))}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, state…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Building2} title="No training partners" description="Nothing matches this filter." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation</TableHead>
                <TableHead className="hidden md:table-cell">Scheme</TableHead>
                <TableHead className="hidden lg:table-cell">State</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden xl:table-cell">Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tp) => (
                <TableRow key={tp._id}>
                  <TableCell>
                    <p className="font-medium">{tp.organizationName}</p>
                    <p className="text-xs text-muted-foreground">{tp.registeredOfficeEmail}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tp.scheme || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{tp.registeredOfficeState || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <ApplicationStatusBadge status={tp.applicationStatus} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(tp.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <TrainingPartnerSheet tp={tp} />
                      {tp.applicationStatus === "Pending" && (
                        <>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <X />
                                Reject
                              </Button>
                            }
                            title={`Reject ${tp.organizationName}?`}
                            description="The training partner will not be able to create centres or batches."
                            confirmLabel="Reject"
                            destructive
                            onConfirm={() => reject.mutateAsync(tp._id)}
                          />
                          <ApproveDialog tp={tp} />
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
