"use client";

import { useState } from "react";
import { Award, Ban, Download, ExternalLink, RefreshCw } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { ToaCertificate } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field, TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CertificateStatusBadge } from "@/features/toa/labels";

type Tab = "valid" | "reissued" | "revoked" | "all";

function Reissue({ certificate }: { certificate: ToaCertificate }) {
  const reissue = useApiMutation((body: { reason: string; name: string }) => api.put(`/toa/admin/certificates/${certificate._id}/reissue`, body), "Corrected certificate issued");
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <RefreshCw />
          Correct & reissue
        </Button>
      }
      title={`Reissue ${certificate.certificateNumber}?`}
      description="A corrected certificate with a new number is issued. The old one stays verifiable and points to the new one."
      submitLabel="Reissue"
      onSubmit={(form) => reissue.mutateAsync({ reason: String(form.get("reason")).trim(), name: String(form.get("name")).trim() })}
    >
      <div className="grid gap-4">
        <Field label="Name on the certificate" name="name" defaultValue={certificate.snapshot.name} required />
        <TextareaField label="Reason" name="reason" required rows={3} placeholder="e.g. Spelling of the name corrected on request" />
      </div>
    </FormDialog>
  );
}

function Revoke({ certificate }: { certificate: ToaCertificate }) {
  const revoke = useApiMutation((reason: string) => api.put(`/toa/admin/certificates/${certificate._id}/revoke`, { reason }), "Certificate revoked");
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Ban />
          Revoke
        </Button>
      }
      title={`Revoke ${certificate.certificateNumber}?`}
      description="The verification page will show it as revoked with your reason. It can no longer be downloaded."
      submitLabel="Revoke"
      onSubmit={(form) => revoke.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason" name="reason" required rows={3} />
    </FormDialog>
  );
}

export function ToaCertificatesPage() {
  const [tab, setTab] = useState<Tab>("valid");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaCertificate>("/toa/admin/certificates");
  const rows = data.filter((cert) => (tab === "all" || cert.status === tab) && matches(search, cert.certificateNumber, cert.snapshot.name, cert.snapshot.registrationId, cert.snapshot.batchCode, cert.snapshot.trainingPartner ?? ""));
  return (
    <>
      <PageHeader title="ToA certificates" description="Certificates issued when results are published. Corrections are made by reissuing; every change is kept in the audit log." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "valid", label: "Valid", count: data.filter((cert) => cert.status === "valid").length },
                { value: "reissued", label: "Replaced", count: data.filter((cert) => cert.status === "reissued").length },
                { value: "revoked", label: "Revoked", count: data.filter((cert) => cert.status === "revoked").length },
                { value: "all", label: "All", count: data.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search number, name, batch…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Award} title="No certificates here" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate</TableHead>
                <TableHead>Assessor</TableHead>
                <TableHead className="hidden lg:table-cell">Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((cert) => (
                <TableRow key={cert._id}>
                  <TableCell>
                    <p className="font-medium">{cert.certificateNumber}</p>
                    <p className="text-xs text-muted-foreground">Issued {formatDate(cert.issueDate)}</p>
                  </TableCell>
                  <TableCell>
                    <p>{cert.snapshot.name}</p>
                    <p className="text-xs text-muted-foreground">{cert.snapshot.registrationId}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p>{cert.snapshot.batchCode}</p>
                    <p className="text-xs text-muted-foreground">{cert.snapshot.trainingPartner}</p>
                  </TableCell>
                  <TableCell>
                    <CertificateStatusBadge status={cert.status} />
                    {cert.statusReason && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{cert.statusReason}</p>}
                    {cert.replacedBy && <p className="text-xs text-muted-foreground">→ {cert.replacedBy.certificateNumber}</p>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" asChild aria-label="Open verification page">
                      <a href={`/verify/toa/${cert.verifyCode}`} target="_blank" rel="noreferrer">
                        <ExternalLink />
                      </a>
                    </Button>
                    {cert.status === "valid" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => downloadFile(`/toa/admin/certificates/${cert._id}/pdf`, `${cert.snapshot.registrationId}-certificate.pdf`)}>
                          <Download />
                          PDF
                        </Button>
                        <Reissue certificate={cert} />
                        <Revoke certificate={cert} />
                      </>
                    )}
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
