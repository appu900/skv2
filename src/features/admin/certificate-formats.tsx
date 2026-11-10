"use client";

import { useEffect, useState } from "react";
import { Eye, RotateCcw, Save } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { Scheme, TrainingPartner } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectField } from "@/components/shared/field";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Format {
  custom: boolean;
  version: number;
  source: "partner_scheme" | "partner" | "scheme" | "default" | "built-in";
  html: string;
}
const SOURCE: Record<Format["source"], string> = {
  partner_scheme: "Partner + scheme format",
  partner: "Partner format",
  scheme: "Scheme format",
  default: "CUTM default",
  "built-in": "Built-in",
};
const PLACEHOLDERS =
  "{{studentName}} {{fatherName}} {{dob}} {{enrollmentNumber}} {{registrationNo}} {{qualification}} {{level}} {{credit}} {{duration}} {{trainingCentre}} {{district}} {{state}} {{grade}} {{scheme}} {{schemeType}} {{schemeLogo}} (image src) {{photo}} (image src) {{placeOfIssue}} {{issueDate}} {{certificateNumber}} {{trainingPartner}} {{tpCode}} {{batchCode}} {{qrCode}} (image src) {{verifyUrl}}. Wrap optional pictures in {{#photo}}…{{/photo}} so nothing shows when there is none.";
const ANY = "any";

export function CertificateFormatsPage() {
  const partners = useList<TrainingPartner>("/tp/status/approved");
  const schemes = useList<Scheme>("/scheme");
  const saved = useList<{ _id: string; tp?: { organizationName: string; tpCode?: string } | null; scheme?: string | null; version: number }>("/certificate-formats/saved");
  const [tp, setTp] = useState(ANY);
  const [scheme, setScheme] = useState(ANY);
  const scope = `?tp=${tp}&scheme=${encodeURIComponent(scheme)}`;
  const { data: current } = useItem<Format>(`/certificate-formats${scope}`);
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (current) setHtml(current.html);
  }, [current]);
  const tpName = partners.data?.find((item) => item._id === tp)?.organizationName;
  const level = tp !== ANY && scheme !== ANY ? `${tpName} + ${scheme}` : tp !== ANY ? tpName ?? "this partner" : scheme !== ANY ? scheme : "every partner (CUTM default)";
  const save = useApiMutation(() => api.put(`/certificate-formats${scope}`, { html }), `Certificate format saved for ${level}`);
  const reset = useApiMutation(() => api.delete(`/certificate-formats${scope}`), "Format removed; the next level applies");

  return (
    <>
      <PageHeader
        title="Certificate formats"
        description="The certificate PDF of the normal training partner flow. Each certificate uses the most specific format: partner + scheme, then partner, then scheme, then the CUTM default. Download certificates from a batch's results."
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit a format</CardTitle>
            <CardDescription>Choose who the format is for, edit its HTML and preview it with sample data before saving.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Training partner"
                name="tp"
                value={tp}
                onValueChange={setTp}
                options={[{ value: ANY, label: "Any partner" }, ...(partners.data ?? []).map((item) => ({ value: item._id, label: `${item.organizationName}${item.tpCode ? ` (${item.tpCode})` : ""}` }))]}
              />
              <SelectField label="Scheme" name="scheme" value={scheme} onValueChange={setScheme} options={[{ value: ANY, label: "Any scheme" }, ...(schemes.data ?? []).map((item) => item.name)]} />
            </div>
            {!current ? (
              <LoadingRows rows={4} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Editing for {level} · currently in use:</span>
                  <Badge variant={current.custom ? "default" : "outline"}>{SOURCE[current.source]}</Badge>
                  {current.custom && <Badge variant="secondary">v{current.version}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Placeholders: <code className="break-words">{PLACEHOLDERS}</code> Values are always escaped; scripts and links to other sites are blocked, so embed logos as data: images.
                </p>
                <Textarea value={html} onChange={(event) => setHtml(event.target.value)} rows={20} spellCheck={false} className="font-mono text-xs" aria-label="Certificate HTML" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => downloadFile(`/certificate-formats/preview${scope}`, "certificate-preview.pdf", { method: "POST", body: { html } })}>
                    <Eye />
                    Preview PDF
                  </Button>
                  <Button onClick={() => save.mutate(undefined)} disabled={save.isPending || (html === current.html && current.custom)}>
                    <Save />
                    Save for {level}
                  </Button>
                  {current.custom && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost">
                          <RotateCcw />
                          Remove this format
                        </Button>
                      }
                      title={`Remove the certificate format for ${level}?`}
                      description="Certificates fall back to the next level (partner, scheme, CUTM default or built-in)."
                      confirmLabel="Remove"
                      onConfirm={() => reset.mutateAsync(undefined)}
                    />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved formats</CardTitle>
          </CardHeader>
          <CardContent>
            {!saved.data?.length ? (
              <p className="text-sm text-muted-foreground">None yet: every certificate uses the built-in format.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Training partner</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead className="text-right">Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saved.data.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.tp ? `${row.tp.organizationName}${row.tp.tpCode ? ` (${row.tp.tpCode})` : ""}` : "Any"}</TableCell>
                      <TableCell>{row.scheme ?? "Any"}</TableCell>
                      <TableCell className="text-right tabular-nums">v{row.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
