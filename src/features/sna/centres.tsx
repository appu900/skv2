"use client";

import { useState } from "react";
import { BadgeCheck, Eye, School, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Centre, CentreSector } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { useSession } from "@/lib/auth/use-session";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { TextareaField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
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

type Tab = "pending" | "all";

const partnerName = (centre: Centre) =>
  typeof centre.trainingOrganizationId === "object" ? centre.trainingOrganizationId?.organizationName : undefined;

// Approval of this SNA's scheme on a centre (a centre can run several schemes).
const schemeEntry = (centre: Centre, scheme?: string) => centre.schemes.find((entry) => entry.schemeName === scheme);

function ApproveCentre({ centre, scheme, state }: { centre: Centre; scheme?: string; state?: string }) {
  const approve = useApiMutation(() => api.put(`/sna/center/approve/${centre._id}`, { schemeName: scheme, state }), `${centre.name} approved`);
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm">
          <BadgeCheck />
          Approve
        </Button>
      }
      title={`Approve ${centre.name}?`}
      description={`The training partner can then create ${scheme} batches at this centre.`}
      confirmLabel="Approve centre"
      onConfirm={() => approve.mutateAsync(undefined)}
    />
  );
}

function RejectCentre({ centre, scheme, state }: { centre: Centre; scheme?: string; state?: string }) {
  const reject = useApiMutation(
    (reason: string) => api.put(`/sna/center/reject/${centre._id}`, { schemeName: scheme, state, reason }),
    `${centre.name} rejected`
  );
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <XCircle />
          Reject
        </Button>
      }
      title={`Reject ${centre.name}?`}
      description={`The training partner sees your reason and cannot run ${scheme} batches at this centre.`}
      submitLabel="Reject centre"
      onSubmit={(form) => reject.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} placeholder="e.g. The sanction order letter does not match the centre address" />
    </FormDialog>
  );
}

export function CentreSheet({ centre }: { centre: Centre }) {
  const sectors = (centre.sectors ?? []).filter((sector): sector is CentreSector => typeof sector === "object");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          View
        </Button>
      </SheetTrigger>
      <SheetContent size="md">
        <SheetHeader>
          <SheetTitle>{centre.name}</SheetTitle>
          <SheetDescription>
            {centre.centerId} · {centre.state}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <DetailList
            items={[
              ["Training partner", partnerName(centre)],
              ["Centre code", centre.centerId],
              ["Project ID", centre.projectId],
              ["PRN number", centre.PRN_NO],
              ["State", centre.state],
              ["Sectors", sectors.map((sector) => sector.name).join(", ")],
            ]}
          />
          <FileLink href={centre.sanction_order_letter} label="Sanction order letter" />
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Schemes at this centre</h3>
            <div className="flex flex-wrap gap-1.5">
              {centre.schemes.map((entry) => (
                <Badge key={entry.schemeName} variant={entry.approveStatus ? "success" : entry.rejectStatus ? "destructive" : "warning"}>
                  {entry.schemeName} · {entry.approveStatus ? "approved" : entry.rejectStatus ? "rejected" : "pending"}
                </Badge>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SnaCentresPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const pending = useList<Centre>("/sna/centers/query");
  const all = useList<Centre>(
    session?.scheme && session.state ? `/center/sna/query?scheme=${encodeURIComponent(session.scheme)}&state=${encodeURIComponent(session.state)}` : null
  );

  const source = tab === "pending" ? pending : all;
  const rows = (source.data ?? []).filter((centre) => matches(search, centre.name, centre.centerId, partnerName(centre)));

  return (
    <>
      <PageHeader
        title="Centres"
        description={`Training centres that want to run ${session?.scheme ?? "your scheme"} in ${session?.state ?? "your state"}. Batches can only be created at approved centres.`}
      />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "pending", label: "Awaiting approval", count: pending.data?.length },
                { value: "all", label: "All centres", count: all.data?.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search centre or partner…" />
            </div>
          </>
        }
      >
        {source.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={School} title={tab === "pending" ? "No centres waiting" : "No centres yet"} description={tab === "pending" ? "New centre requests for your scheme appear here." : undefined} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden sm:table-cell">PRN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((centre) => {
                const entry = schemeEntry(centre, session?.scheme);
                const approved = entry?.approveStatus;
                const rejected = entry?.rejectStatus;
                return (
                  <TableRow key={centre._id}>
                    <TableCell>
                      <p className="font-medium">{centre.name}</p>
                      <p className="text-xs text-muted-foreground">{centre.centerId}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{partnerName(centre) ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{centre.PRN_NO}</TableCell>
                    <TableCell>
                      {approved ? (
                        <Badge variant="success">Approved</Badge>
                      ) : rejected ? (
                        <Badge variant="destructive" title={entry?.rejectReason}>
                          Rejected
                        </Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <CentreSheet centre={centre} />
                      {!approved && !rejected && <RejectCentre centre={centre} scheme={session?.scheme} state={session?.state} />}
                      {!approved && <ApproveCentre centre={centre} scheme={session?.scheme} state={session?.state} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
