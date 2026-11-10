"use client";

import { useState } from "react";
import { BadgeCheck, School, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Centre, Scheme } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CentreSheet } from "@/features/sna/centres";

const partnerName = (centre: Centre) =>
  typeof centre.trainingOrganizationId === "object" ? centre.trainingOrganizationId?.organizationName : undefined;

function ApproveScheme({ centre, scheme }: { centre: Centre; scheme: string }) {
  const approve = useApiMutation(() => api.put(`/lcrc/center/approve/${centre._id}`, { schemeName: scheme }), `${centre.name} approved for ${scheme}`);
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm">
          <BadgeCheck />
          Approve
        </Button>
      }
      title={`Approve ${centre.name} for ${scheme}?`}
      description={`The training partner can then create ${scheme} batches at this centre.`}
      confirmLabel="Approve centre"
      onConfirm={() => approve.mutateAsync(undefined)}
    />
  );
}

function RejectScheme({ centre, scheme }: { centre: Centre; scheme: string }) {
  const reject = useApiMutation(
    (reason: string) => api.put(`/lcrc/center/reject/${centre._id}`, { schemeName: scheme, reason }),
    `${centre.name} rejected for ${scheme}`
  );
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <XCircle />
          Reject
        </Button>
      }
      title={`Reject ${centre.name} for ${scheme}?`}
      description="The training partner sees your reason and cannot run this scheme at the centre."
      submitLabel="Reject centre"
      onSubmit={(form) => reject.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} placeholder="e.g. The address on the sanction letter does not match" />
    </FormDialog>
  );
}

// One row per centre and corporate scheme waiting for a decision.
export function LcrcCentresPage() {
  const [search, setSearch] = useState("");
  const centres = useList<Centre>("/lcrc/centers/pending");
  const schemes = useList<Scheme>("/scheme");
  const corporate = new Set((schemes.data ?? []).filter((scheme) => scheme.schemeType === "Corporate").map((scheme) => scheme.name));

  const rows = (centres.data ?? [])
    .flatMap((centre) =>
      centre.schemes
        .filter((entry) => corporate.has(entry.schemeName) && !entry.approveStatus && !entry.rejectStatus)
        .map((entry) => ({ centre, scheme: entry.schemeName }))
    )
    .filter(({ centre, scheme }) => matches(search, centre.name, centre.centerId, partnerName(centre), scheme));

  return (
    <>
      <PageHeader title="Centres" description="Training centres that applied to run a corporate scheme. Batches can only be created at approved centres." />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search centre, partner, scheme…" />}>
        {centres.isLoading || schemes.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={School} title="No centres waiting" description="New corporate centre requests appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead>Scheme</TableHead>
                <TableHead className="hidden sm:table-cell">State</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ centre, scheme }) => (
                <TableRow key={`${centre._id}-${scheme}`}>
                  <TableCell>
                    <p className="font-medium">{centre.name}</p>
                    <p className="text-xs text-muted-foreground">{centre.centerId}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{partnerName(centre) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{scheme}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{centre.state}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <CentreSheet centre={centre} />
                    <RejectScheme centre={centre} scheme={scheme} />
                    <ApproveScheme centre={centre} scheme={scheme} />
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
