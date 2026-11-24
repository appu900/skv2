"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadFile } from "@/lib/api/download";
import type { ToaTrainingPartner } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Programme {
  feeMode: "per_assessor" | "per_batch";
  feeAmount: number;
  gstPercent: number;
  invoiceDueDays: number;
  minAttendancePercent: number;
  passMark: number;
  paymentRequiredForCertificate: boolean;
  assessorPortalEnabled: boolean;
  maxBatchCapacity: number;
}
interface Override {
  _id: string;
  scope: string;
  trainingPartnerId?: string | null;
  value: Partial<Programme>;
  version: number;
  updatedAt: string;
}
interface Template {
  type: "certificate" | "invoice" | "receipt" | "attendance_sheet";
  source: "partner" | "default" | "built-in";
  custom: boolean;
  version: number;
  html: string;
}

const yesNo = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

function ProgrammeSettings() {
  const resolved = useItem<{ value: Programme }>("/config/resolve?key=toaProgramme");
  const save = useApiMutation((value: Partial<Programme>) => api.put("/config", { key: "toaProgramme", scope: "global", value }), "Programme settings saved");
  const value = resolved.data?.value;
  if (!value) return <LoadingRows rows={4} />;
  return (
    <form
      key={JSON.stringify(value)}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        save.mutate({
          feeMode: form.get("feeMode") as Programme["feeMode"],
          feeAmount: Number(form.get("feeAmount")),
          gstPercent: Number(form.get("gstPercent")),
          invoiceDueDays: Number(form.get("invoiceDueDays")),
          minAttendancePercent: Number(form.get("minAttendancePercent")),
          passMark: Number(form.get("passMark")),
          maxBatchCapacity: Number(form.get("maxBatchCapacity")),
          paymentRequiredForCertificate: form.get("paymentRequiredForCertificate") === "true",
          assessorPortalEnabled: form.get("assessorPortalEnabled") === "true",
        });
      }}
    >
      <SelectField label="Fee is charged" name="feeMode" defaultValue={value.feeMode} options={[{ value: "per_assessor", label: "Per assessor" }, { value: "per_batch", label: "Per batch" }]} />
      <Field label="Fee (₹, before GST)" name="feeAmount" type="number" min={0} step="0.01" defaultValue={value.feeAmount} required />
      <Field label="GST %" name="gstPercent" type="number" min={0} max={100} step="0.01" defaultValue={value.gstPercent} required />
      <Field label="Invoice due in (days)" name="invoiceDueDays" type="number" min={0} max={365} defaultValue={value.invoiceDueDays} required />
      <Field label="Minimum attendance for a certificate (%)" name="minAttendancePercent" type="number" min={0} max={100} defaultValue={value.minAttendancePercent} required />
      <Field label="Pass mark (out of 100)" name="passMark" type="number" min={0} max={100} defaultValue={value.passMark} required />
      <Field label="Maximum batch capacity" name="maxBatchCapacity" type="number" min={1} max={1000} defaultValue={value.maxBatchCapacity} required />
      <SelectField label="Payment needed before a certificate" name="paymentRequiredForCertificate" defaultValue={String(value.paymentRequiredForCertificate)} options={yesNo} />
      <SelectField label="Assessors can log in" name="assessorPortalEnabled" defaultValue={String(value.assessorPortalEnabled)} options={yesNo} />
      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={save.isPending}>
          <Save />
          Save settings
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">New values apply to invoices raised and results published from now on; existing invoices keep their amounts.</p>
      </div>
    </form>
  );
}

function PartnerOverrides() {
  const partners = useList<ToaTrainingPartner>("/toa/admin/tps");
  const overrides = useList<Override>("/config?key=toaProgramme");
  const add = useApiMutation((body: Record<string, unknown>) => api.put("/config", body), "Override saved");
  const remove = useApiMutation((id: string) => api.delete(`/config/${id}`), "Override removed");
  const name = (id?: string | null) => partners.data?.find((tp) => tp._id === id)?.organizationName ?? id;
  const rows = (overrides.data ?? []).filter((row) => row.scope === "trainingPartner");
  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Every ToA partner uses the settings above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Training partner</TableHead>
              <TableHead>Overrides</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{name(row.trainingPartnerId)}</TableCell>
                <TableCell className="text-sm">
                  {Object.entries(row.value)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" · ")}
                </TableCell>
                <TableCell className="text-right">
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Remove override">
                        <Trash2 />
                      </Button>
                    }
                    title="Remove this override?"
                    description="The partner goes back to the general settings."
                    confirmLabel="Remove"
                    destructive
                    onConfirm={() => remove.mutateAsync(row._id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <FormDialog
        trigger={
          <Button variant="outline" size="sm" className="self-start">
            <Plus />
            Special fee for a partner
          </Button>
        }
        title="Special fee for one training partner"
        description="Only the fields you fill in replace the general settings for this partner."
        onSubmit={(form) => {
          const value: Record<string, unknown> = {};
          if (form.get("feeMode")) value.feeMode = form.get("feeMode");
          if (form.get("feeAmount")) value.feeAmount = Number(form.get("feeAmount"));
          if (form.get("gstPercent")) value.gstPercent = Number(form.get("gstPercent"));
          return add.mutateAsync({ key: "toaProgramme", scope: "trainingPartner", trainingPartnerId: form.get("tp"), value });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Training partner" name="tp" required className="sm:col-span-2" options={(partners.data ?? []).map((tp) => ({ value: tp._id, label: `${tp.organizationName} (${tp.tpCode})` }))} />
          <SelectField label="Fee is charged" name="feeMode" options={[{ value: "per_assessor", label: "Per assessor" }, { value: "per_batch", label: "Per batch" }]} />
          <Field label="Fee (₹)" name="feeAmount" type="number" min={0} step="0.01" />
          <Field label="GST %" name="gstPercent" type="number" min={0} max={100} step="0.01" />
        </div>
      </FormDialog>
    </div>
  );
}

const PLACEHOLDERS: Record<Template["type"], string> = {
  certificate: "{{name}} {{registrationId}} {{certificateNumber}} {{issueDate}} {{programmeName}} {{trainingPartner}} {{batchCode}} {{startDate}} {{endDate}} {{result}} {{qrCode}} (image src) {{verifyUrl}}",
  invoice: "{{invoiceNumber}} {{invoiceDate}} {{dueDate}} {{payer.organizationName}} {{payer.tpCode}} {{payer.address}} {{payer.gstNumber}} {{batchCode}} {{programmeName}} {{#lines}}{{index}} {{description}} {{quantity}} {{rate}} {{amount}}{{/lines}} {{subtotal}} {{gstPercent}} {{gstAmount}} {{total}} {{statusLabel}}",
  receipt: "{{receiptNumber}} {{paidAt}} {{organizationName}} {{tpCode}} {{invoiceNumber}} {{batchCode}} {{method}} {{gateway}} {{paymentId}} {{orderId}} {{amount}}",
  attendance_sheet: "{{batchCode}} {{programmeName}} {{sessionDate}} {{sessionTime}} {{sessionTopic}} {{trainingPartner}} {{trainingMode}} {{venue}} {{trainerName}} {{#rows}}{{index}} {{registrationId}} {{name}} {{status}}{{/rows}}",
};
const TITLES: Record<Template["type"], string> = { certificate: "Certificate", invoice: "Invoice", receipt: "Receipt", attendance_sheet: "Attendance sheet" };

const SOURCE_LABEL: Record<Template["source"], string> = {
  partner: "This partner's own template",
  default: "CUTM default template",
  "built-in": "Built-in template",
};

function TemplateEditor() {
  const partners = useList<ToaTrainingPartner>("/toa/admin/tps");
  const owners = useList<{ type: Template["type"]; toaTpId: string; organizationName: string; tpCode: string }>("/toa/admin/templates/partners");
  const [partner, setPartner] = useState("default");
  const scope = `?toaTpId=${partner}`;
  const { data } = useList<Template>(`/toa/admin/templates${scope}`);
  const [type, setType] = useState<Template["type"]>("certificate");
  const current = data?.find((item) => item.type === type);
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (current) setHtml(current.html);
  }, [current]);
  const forPartner = partner !== "default";
  const partnerName = partners.data?.find((tp) => tp._id === partner)?.organizationName;
  const save = useApiMutation(() => api.put(`/toa/admin/templates/${type}${scope}`, { html }), forPartner ? `Saved for ${partnerName}` : "Default template saved for all partners");
  const reset = useApiMutation(() => api.delete(`/toa/admin/templates/${type}${scope}`), forPartner ? `${partnerName} now uses the default template` : "Built-in template restored");
  const ownersOf = (owners.data ?? []).filter((row) => row.type === type);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-end">
        <SelectField
          label="Template for"
          name="templatePartner"
          value={partner}
          onValueChange={setPartner}
          options={[{ value: "default", label: "All partners (CUTM default)" }, ...(partners.data ?? []).map((tp) => ({ value: tp._id, label: `${tp.organizationName} (${tp.tpCode})` }))]}
        />
        <p className="text-xs text-muted-foreground">
          {forPartner
            ? `Documents of ${partnerName ?? "this partner"} use its own template when it has one, otherwise the CUTM default.`
            : "The default is used for every partner that has no template of its own."}
        </p>
      </div>
      {!data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          <Tabs value={type} onValueChange={(value) => setType(value as Template["type"])}>
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
            <span className="text-muted-foreground">In use:</span>
            <Badge variant={current?.source === "partner" ? "default" : "outline"}>{current ? SOURCE_LABEL[current.source] : "…"}</Badge>
            {!forPartner && ownersOf.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Own {TITLES[type].toLowerCase()} template: {ownersOf.map((row) => row.organizationName).join(", ")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Placeholders: <code className="break-words">{PLACEHOLDERS[type]}</code>. Values are always escaped; scripts and links to other sites are blocked when the PDF is made, so embed logos as data: images.
          </p>
          <Textarea value={html} onChange={(event) => setHtml(event.target.value)} rows={18} spellCheck={false} className="font-mono text-xs" aria-label={`${TITLES[type]} HTML`} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadFile(`/toa/admin/templates/${type}/preview${scope}`, `${type}-preview.pdf`, { method: "POST", body: { html } })}>
              <Eye />
              Preview PDF with sample data
            </Button>
            <Button onClick={() => save.mutate(undefined)} disabled={save.isPending || (html === current?.html && current?.custom)}>
              <Save />
              {forPartner ? `Save for ${partnerName ?? "this partner"}` : "Save as default"}
            </Button>
            {current?.custom && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost">
                    <RotateCcw />
                    {forPartner ? "Remove partner template" : "Restore built-in"}
                  </Button>
                }
                title={forPartner ? `Remove ${partnerName}'s own ${TITLES[type].toLowerCase()} template?` : `Restore the built-in ${TITLES[type].toLowerCase()} template?`}
                description={forPartner ? "The partner goes back to the CUTM default template." : "Partners with their own template keep it."}
                confirmLabel={forPartner ? "Remove" : "Restore"}
                onConfirm={() => reset.mutateAsync(undefined)}
              />
            )}
          </div>
          {forPartner && !current?.custom && (
            <p className="text-xs text-muted-foreground">This partner has no {TITLES[type].toLowerCase()} template of its own yet. Edit the text above and save to create one.</p>
          )}
        </>
      )}
    </div>
  );
}

export function ToaSettingsPage() {
  return (
    <>
      <PageHeader title="ToA settings" description="Fees and eligibility rules of the RailTel Training of Assessors programme, and the HTML templates of the documents it generates." />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Programme rules</CardTitle>
            <CardDescription>Stored in the configuration engine and applied to every ToA partner unless overridden below.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgrammeSettings />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partner-specific fees</CardTitle>
          </CardHeader>
          <CardContent>
            <PartnerOverrides />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document templates</CardTitle>
            <CardDescription>HTML for certificates, invoices, receipts and attendance sheets, as a CUTM default or per training partner. Preview before saving.</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateEditor />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
