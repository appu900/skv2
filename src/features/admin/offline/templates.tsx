"use client";

import { useEffect, useState } from "react";
import { Eye, RotateCcw, Save } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { Scheme } from "@/lib/api/models";
import type { OfflineTemplate, OfflineTp } from "@/lib/api/offline";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectField } from "@/components/shared/field";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Type = OfflineTemplate["type"];
const TITLES: Record<Type, string> = { certificate: "Certificate", attendance_sheet: "Attendance sheet", result_sheet: "Result sheet", id_card: "Assessor ID card" };
const SOURCE: Record<OfflineTemplate["source"], string> = {
  partner_scheme: "Partner + scheme format",
  partner: "Partner format",
  scheme: "Scheme format",
  default: "CUTM default",
  "built-in": "Built-in",
};
const PLACEHOLDERS: Record<Type, string> = {
  certificate: "{{name}} {{fatherName}} {{enrollmentNumber}} {{candidateId}} {{certificateNumber}} {{issueDate}} {{jobRole}} {{qpCode}} {{nsqfLevel}} {{sector}} {{scheme}} {{trainingPartner}} {{tpCode}} {{centreName}} {{district}} {{state}} {{startDate}} {{endDate}} {{assessmentDate}} {{grade}} {{percentage}} {{result}} {{qrCode}} (image src) {{verifyUrl}} {{batchCode}} {{externalBatchId}}",
  attendance_sheet: "batch fields ({{batchCode}} {{jobRole}} {{scheme}} {{trainingPartner}} {{centreName}} {{assessmentDate}} {{assessorName}} {{assessorCode}} …) {{count}} {{present}} {{#rows}}{{index}} {{enrollmentNumber}} {{candidateId}} {{name}} {{fatherName}} {{attendance}}{{/rows}}",
  result_sheet: "batch fields + {{passPercent}} {{totalMax}} {{#components}}{{label}} {{max}}{{/components}} {{#rows}}{{index}} {{enrollmentNumber}} {{name}} {{#marks}}{{value}}{{/marks}} {{total}} {{percentage}} {{grade}} {{result}}{{/rows}} {{present}} {{passed}} {{failed}} {{absent}}",
  id_card: "{{name}} {{assessorCode}} {{photo}} (image src) {{mobile}} {{qualification}} {{sectors}} {{bloodGroup}} {{validTill}} {{issueDate}}. Set the card size with @page { size: 54mm 86mm }.",
};
const ANY = "any";

export function OfflineTemplatesPage() {
  const tps = useList<OfflineTp>("/offline/admin/tps");
  const schemes = useList<Scheme>("/scheme");
  const saved = useList<{ _id: string; type: Type; tp?: { organizationName: string; tpCode: string } | null; scheme?: string | null; version: number }>("/offline/admin/templates/saved");
  const [tp, setTp] = useState(ANY);
  const [scheme, setScheme] = useState(ANY);
  const [type, setType] = useState<Type>("certificate");
  const scope = `?tp=${tp}&scheme=${encodeURIComponent(scheme)}`;
  const { data } = useList<OfflineTemplate>(`/offline/admin/templates${scope}`);
  const current = data?.find((item) => item.type === type);
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (current) setHtml(current.html);
  }, [current]);
  const tpName = tps.data?.find((item) => item._id === tp)?.organizationName;
  const levelLabel = tp !== ANY && scheme !== ANY ? `${tpName} + ${scheme}` : tp !== ANY ? tpName ?? "this partner" : scheme !== ANY ? scheme : "everyone (CUTM default)";
  const save = useApiMutation(() => api.put(`/offline/admin/templates/${type}${scope}`, { html }), `${TITLES[type]} format saved for ${levelLabel}`);
  const reset = useApiMutation(() => api.delete(`/offline/admin/templates/${type}${scope}`), "Format removed; the next level applies");
  const idCardScoped = type === "id_card" && (tp !== ANY || scheme !== ANY);

  return (
    <>
      <PageHeader
        title="Document formats"
        description="Offline partners each have their own certificate, attendance sheet and result sheet. A document uses the most specific format: partner + scheme, then partner, then scheme, then the CUTM default."
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit a format</CardTitle>
            <CardDescription>Choose who the format is for, then edit its HTML. Preview with sample data before saving.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Training partner" name="tp" value={tp} onValueChange={setTp} options={[{ value: ANY, label: "Any partner" }, ...(tps.data ?? []).map((item) => ({ value: item._id, label: `${item.organizationName} (${item.tpCode})` }))]} />
              <SelectField label="Scheme" name="scheme" value={scheme} onValueChange={setScheme} options={[{ value: ANY, label: "Any scheme" }, ...(schemes.data ?? []).map((item) => item.name)]} />
            </div>
            {!data ? (
              <LoadingRows rows={4} />
            ) : (
              <>
                <Tabs value={type} onValueChange={(value) => setType(value as Type)}>
                  <TabsList className="h-auto flex-wrap">
                    {data.map((item) => (
                      <TabsTrigger key={item.type} value={item.type}>
                        {TITLES[item.type]}
                        {item.custom && <Badge variant="secondary">v{item.version}</Badge>}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Editing for {levelLabel} · currently in use:</span>
                  <Badge variant={current?.custom ? "default" : "outline"}>{current ? SOURCE[current.source] : "…"}</Badge>
                </div>
                {idCardScoped && <p className="text-xs text-muted-foreground">ID cards belong to CUTM assessors, not to a partner, so only the "Any partner / Any scheme" ID card format is used.</p>}
                <p className="text-xs text-muted-foreground">
                  Placeholders: <code className="break-words">{PLACEHOLDERS[type]}</code>. Values are always escaped; scripts and links to other sites are blocked, so embed logos as data: images.
                </p>
                <Textarea value={html} onChange={(event) => setHtml(event.target.value)} rows={18} spellCheck={false} className="font-mono text-xs" aria-label={`${TITLES[type]} HTML`} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => downloadFile(`/offline/admin/templates/${type}/preview${scope}`, `${type}-preview.pdf`, { method: "POST", body: { html } })}>
                    <Eye />
                    Preview PDF
                  </Button>
                  <Button onClick={() => save.mutate(undefined)} disabled={save.isPending || idCardScoped || (html === current?.html && current?.custom)}>
                    <Save />
                    Save for {levelLabel}
                  </Button>
                  {current?.custom && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost">
                          <RotateCcw />
                          Remove this format
                        </Button>
                      }
                      title={`Remove the ${TITLES[type].toLowerCase()} format for ${levelLabel}?`}
                      description="Documents fall back to the next level (partner, scheme, CUTM default or built-in)."
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
              <p className="text-sm text-muted-foreground">None yet: every document uses the built-in format.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead className="text-right">Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saved.data.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{TITLES[row.type]}</TableCell>
                      <TableCell>{row.tp ? `${row.tp.organizationName} (${row.tp.tpCode})` : "Any"}</TableCell>
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
