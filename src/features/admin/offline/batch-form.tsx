"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Scheme } from "@/lib/api/models";
import type { MarkComponent, OfflineBatch, OfflineTp } from "@/lib/api/offline";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { Field, SelectField } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const BATCH_FIELDS = ["tp", "externalBatchId", "scheme", "schemeType", "jobRole", "qpCode", "nsqfLevel", "sector", "centreName", "centreAddress", "district", "state", "startDate", "endDate", "assessmentDate", "passPercent"];

export function batchPayload(form: FormData, components: { label: string; max: string }[]) {
  const body: Record<string, unknown> = Object.fromEntries(BATCH_FIELDS.map((field) => [field, form.get(field)]).filter(([, value]) => value !== null && value !== ""));
  body.components = components.filter((component) => component.label.trim()).map((component) => ({ label: component.label.trim(), max: Number(component.max) }));
  return body;
}

// Marks columns of the result sheet: every partner's format is different.
export function ComponentsEditor({ value, onChange, disabled }: { value: { label: string; max: string }[]; onChange: (next: { label: string; max: string }[]) => void; disabled?: boolean }) {
  const set = (index: number, patch: Partial<{ label: string; max: string }>) => onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const total = value.reduce((sum, row) => sum + (Number(row.max) || 0), 0);
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label>Mark components (result sheet columns) · total {total}</Label>
      {value.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input placeholder="e.g. Theory" value={row.label} disabled={disabled} onChange={(event) => set(index, { label: event.target.value })} aria-label="Component name" />
          <Input type="number" min={1} className="w-28" placeholder="Max" value={row.max} disabled={disabled} onChange={(event) => set(index, { max: event.target.value })} aria-label="Maximum marks" />
          <Button type="button" variant="ghost" size="icon" disabled={disabled || value.length === 1} onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label="Remove component">
            <X />
          </Button>
        </div>
      ))}
      {!disabled && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...value, { label: "", max: "" }])}>
          <Plus />
          Add component
        </Button>
      )}
      {disabled && <p className="text-xs text-muted-foreground">Marks are already entered, so the components are locked.</p>}
    </div>
  );
}

export const componentDraft = (components?: MarkComponent[]) => (components?.length ? components.map((component) => ({ label: component.label, max: String(component.max) })) : [{ label: "Theory", max: "50" }, { label: "Practical", max: "50" }]);

export function BatchFields({ batch, components, setComponents, lockComponents }: { batch?: OfflineBatch; components: { label: string; max: string }[]; setComponents: (next: { label: string; max: string }[]) => void; lockComponents?: boolean }) {
  const tps = useList<OfflineTp>("/offline/admin/tps");
  const schemes = useList<Scheme>("/scheme");
  const [scheme, setScheme] = useState(batch?.scheme ?? "");
  const tpId = typeof batch?.tp === "object" ? batch.tp._id : batch?.tp;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {!batch && (
        <SelectField
          label="Training partner"
          name="tp"
          required
          className="sm:col-span-2"
          defaultValue={tpId}
          options={(tps.data ?? []).filter((tp) => tp.status === "active").map((tp) => ({ value: tp._id, label: `${tp.organizationName} (${tp.tpCode})` }))}
        />
      )}
      <Field label="Job role / course" name="jobRole" required defaultValue={batch?.jobRole} />
      <Field label="Partner's batch ID" name="externalBatchId" defaultValue={batch?.externalBatchId} />
      <SelectField label="Scheme" name="scheme" value={scheme} onValueChange={setScheme} options={(schemes.data ?? []).map((item) => item.name)} placeholder="Select…" />
      <SelectField label="Scheme type" name="schemeType" options={["Central Government", "State Government", "Corporate"]} defaultValue={batch?.schemeType} />
      <Field label="QP code" name="qpCode" defaultValue={batch?.qpCode} />
      <Field label="NSQF level" name="nsqfLevel" defaultValue={batch?.nsqfLevel} />
      <Field label="Sector" name="sector" defaultValue={batch?.sector} />
      <Field label="Centre name" name="centreName" defaultValue={batch?.centreName} />
      <Field label="District" name="district" defaultValue={batch?.district} />
      <SelectField label="State" name="state" options={STATES} defaultValue={batch?.state} />
      <Field label="Centre address" name="centreAddress" defaultValue={batch?.centreAddress} className="sm:col-span-2" />
      <Field label="Training start" name="startDate" type="date" defaultValue={batch?.startDate?.slice(0, 10)} />
      <Field label="Training end" name="endDate" type="date" defaultValue={batch?.endDate?.slice(0, 10)} />
      <Field label="Assessment date" name="assessmentDate" type="date" defaultValue={batch?.assessmentDate?.slice(0, 10)} />
      <Field label="Pass mark (%)" name="passPercent" type="number" min={0} max={100} defaultValue={batch?.passPercent ?? 50} />
      <ComponentsEditor value={components} onChange={setComponents} disabled={lockComponents} />
    </div>
  );
}
