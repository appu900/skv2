"use client";

import type { ToaBatch } from "@/lib/api/toa";
import { Field, SelectField, TextareaField } from "@/components/shared/field";

export const BATCH_FIELDS = ["programmeName", "trainingMode", "startDate", "endDate", "capacity", "schedule", "trainerName", "trainerMobile", "trainerEmail", "trainerQualification", "venue", "meetingLink"];
export const batchPayload = (form: FormData) => Object.fromEntries(BATCH_FIELDS.map((field) => [field, form.get(field)]).filter(([, value]) => value !== null && value !== ""));

// Batch details shared by the create and edit dialogs.
export function BatchFields({ batch }: { batch?: ToaBatch }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Programme name" name="programmeName" required defaultValue={batch?.programmeName} className="sm:col-span-2" placeholder="e.g. Training of Assessors – Signalling" />
      <SelectField label="Training mode" name="trainingMode" required options={["Offline", "Online", "Hybrid"]} defaultValue={batch?.trainingMode} />
      <Field label="Capacity" name="capacity" type="number" min={1} required defaultValue={batch?.capacity} />
      <Field label="Start date" name="startDate" type="date" required defaultValue={batch?.startDate?.slice(0, 10)} />
      <Field label="End date" name="endDate" type="date" required defaultValue={batch?.endDate?.slice(0, 10)} />
      <Field label="Venue" name="venue" defaultValue={batch?.venue} hint="Needed for offline and hybrid batches" />
      <Field label="Online meeting link" name="meetingLink" type="url" defaultValue={batch?.meetingLink} hint="Needed for online and hybrid batches" />
      <Field label="Trainer name" name="trainerName" defaultValue={batch?.trainerName} />
      <Field label="Trainer mobile" name="trainerMobile" pattern="[6-9][0-9]{9}" defaultValue={batch?.trainerMobile} />
      <Field label="Trainer email" name="trainerEmail" type="email" defaultValue={batch?.trainerEmail} />
      <Field label="Trainer qualification" name="trainerQualification" defaultValue={batch?.trainerQualification} />
      <TextareaField label="Schedule notes" name="schedule" rows={2} defaultValue={batch?.schedule} className="sm:col-span-2" placeholder="e.g. 10:00–17:00 daily, lunch 13:00–14:00" />
    </div>
  );
}
