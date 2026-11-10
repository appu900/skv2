"use client";

import { useState } from "react";
import { Ban, Eye, KeyRound, LockOpen, Pencil, Plus, Power, TrainFront } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AuditLogEntry, ToaTrainingPartner } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { Field, SelectField, TextareaField } from "@/components/shared/field";
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
import { actionLabel } from "./toa-audit-log";

type Tab = "active" | "suspended" | "deactivated" | "all";

const STATUS_BADGE: Record<ToaTrainingPartner["status"], React.ReactNode> = {
  active: <Badge variant="success">Active</Badge>,
  suspended: <Badge variant="warning">Suspended</Badge>,
  deactivated: <Badge variant="outline">Deactivated</Badge>,
};

const isLocked = (tp: ToaTrainingPartner) => Boolean(tp.lockUntil && new Date(tp.lockUntil) > new Date());

type Payload = Record<string, FormDataEntryValue | null>;
const formPayload = (form: FormData, fields: string[]): Payload => Object.fromEntries(fields.map((field) => [field, form.get(field)]));
const FIELDS = ["organizationName", "contactPerson", "email", "mobile", "address", "state", "gstNumber", "panNumber"];

function TpFields({ tp }: { tp?: ToaTrainingPartner }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Organisation name" name="organizationName" required defaultValue={tp?.organizationName} className="sm:col-span-2" />
      <Field label="Contact person" name="contactPerson" required defaultValue={tp?.contactPerson} />
      <Field label="Mobile" name="mobile" required pattern="[6-9][0-9]{9}" title="10 digit mobile number" defaultValue={tp?.mobile} />
      {!tp && <Field label="Login email" name="email" type="email" required autoComplete="off" className="sm:col-span-2" hint="Login details are emailed here." />}
      <Field label="Address" name="address" defaultValue={tp?.address} className="sm:col-span-2" />
      <SelectField label="State" name="state" options={STATES} defaultValue={tp?.state} />
      <Field label="GST number" name="gstNumber" defaultValue={tp?.gstNumber} />
      <Field label="PAN" name="panNumber" defaultValue={tp?.panNumber} />
    </div>
  );
}

function CreateTpDialog() {
  const create = useApiMutation((body: Payload) => api.post("/toa/admin/tps", body), "Training partner created, login details are emailed");
  return (
    <FormDialog
      wide
      trigger={
        <Button>
          <Plus />
          New ToA training partner
        </Button>
      }
      title="Create a RailTel ToA training partner"
      description="A temporary password is generated and emailed. The partner must replace it at the first login."
      submitLabel="Create and email login"
      onSubmit={(form) => create.mutateAsync(formPayload(form, FIELDS))}
    >
      <TpFields />
    </FormDialog>
  );
}

function EditTpDialog({ tp }: { tp: ToaTrainingPartner }) {
  const update = useApiMutation((body: Payload) => api.put(`/toa/admin/tps/${tp._id}`, body), "Details saved");
  return (
    <FormDialog
      wide
      trigger={
        <Button variant="outline" size="sm">
          <Pencil />
          Edit details
        </Button>
      }
      title={`Edit ${tp.organizationName}`}
      description="The login email cannot be changed."
      onSubmit={(form) => update.mutateAsync(formPayload(form, FIELDS.filter((field) => field !== "email")))}
    >
      <TpFields tp={tp} />
    </FormDialog>
  );
}

function StatusAction({ tp, status }: { tp: ToaTrainingPartner; status: "suspended" | "deactivated" }) {
  const change = useApiMutation((reason: string) => api.put(`/toa/admin/tps/${tp._id}/status`, { status, reason }), `${tp.organizationName} ${status}`);
  const verb = status === "suspended" ? "Suspend" : "Deactivate";
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          {status === "suspended" ? <Ban /> : <Power />}
          {verb}
        </Button>
      }
      title={`${verb} ${tp.organizationName}?`}
      description={
        status === "suspended"
          ? "They are signed out immediately and cannot log in until you reactivate the account. Their records stay as they are."
          : "Use this when the partnership has ended. They are signed out immediately; the records are kept for audits."
      }
      submitLabel={verb}
      onSubmit={(form) => change.mutateAsync(String(form.get("reason")).trim())}
    >
      <TextareaField label="Reason (emailed to the partner)" name="reason" required rows={3} />
    </FormDialog>
  );
}

function ActivateAction({ tp }: { tp: ToaTrainingPartner }) {
  const activate = useApiMutation(() => api.put(`/toa/admin/tps/${tp._id}/status`, { status: "active" }), `${tp.organizationName} is active again`);
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm">
          <Power />
          Reactivate
        </Button>
      }
      title={`Reactivate ${tp.organizationName}?`}
      description="They can log in again with their current password."
      confirmLabel="Reactivate"
      onConfirm={() => activate.mutateAsync(undefined)}
    />
  );
}

function UnlockAction({ tp }: { tp: ToaTrainingPartner }) {
  const unlock = useApiMutation(() => api.put(`/toa/admin/tps/${tp._id}/unlock`), "Account unlocked");
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm">
          <LockOpen />
          Unlock
        </Button>
      }
      title="Unlock this account?"
      description="It was locked after 5 wrong passwords. Unlocking lets them try again right away."
      confirmLabel="Unlock"
      onConfirm={() => unlock.mutateAsync(undefined)}
    />
  );
}

function ResetPasswordAction({ tp }: { tp: ToaTrainingPartner }) {
  const reset = useApiMutation(() => api.put(`/toa/admin/tps/${tp._id}/reset-password`), `New temporary password emailed to ${tp.email}`);
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm">
          <KeyRound />
          Reset password
        </Button>
      }
      title={`Reset the password of ${tp.organizationName}?`}
      description={`A new temporary password is emailed to ${tp.email}. Every open session ends and they must choose a new password at the next login.`}
      confirmLabel="Reset and email"
      onConfirm={() => reset.mutateAsync(undefined)}
    />
  );
}

function TpSheet({ tp }: { tp: ToaTrainingPartner }) {
  const [open, setOpen] = useState(false);
  const history = useList<AuditLogEntry>(open ? `/toa/admin/audit-logs?entityId=${tp._id}&limit=30` : null);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          Manage
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{tp.organizationName}</SheetTitle>
          <SheetDescription>
            {tp.tpCode} · {tp.email}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_BADGE[tp.status]}
            {isLocked(tp) && <Badge variant="destructive">Locked until {new Date(tp.lockUntil as string).toLocaleTimeString("en-IN", { timeStyle: "short" })}</Badge>}
            {tp.mustChangePassword && <Badge variant="outline">Temporary password</Badge>}
            {tp.createdByAdmin && <Badge variant="secondary">Created by admin</Badge>}
          </div>
          {tp.statusReason && <p className="rounded-lg border bg-muted/40 p-3 text-sm">Reason: {tp.statusReason}</p>}
          <div className="flex flex-wrap gap-2">
            <EditTpDialog tp={tp} />
            <ResetPasswordAction tp={tp} />
            {isLocked(tp) && <UnlockAction tp={tp} />}
            {tp.status === "active" ? (
              <>
                <StatusAction tp={tp} status="suspended" />
                <StatusAction tp={tp} status="deactivated" />
              </>
            ) : (
              <ActivateAction tp={tp} />
            )}
          </div>
          <DetailList
            items={[
              ["Contact person", tp.contactPerson],
              ["Mobile", tp.mobile],
              ["Address", tp.address],
              ["State", tp.state],
              ["GST", tp.gstNumber],
              ["PAN", tp.panNumber],
              ["Created", formatDate(tp.createdAt)],
              ["Last login", formatDate(tp.lastLoginAt)],
              ["Password changed", formatDate(tp.passwordChangedAt)],
            ]}
          />
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            {history.isLoading ? (
              <LoadingRows />
            ) : !history.data?.length ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="flex flex-col divide-y rounded-lg border">
                {history.data.map((entry) => (
                  <li key={entry._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      {actionLabel(entry.action)}
                      {entry.actorRole === "Admin" && <span className="text-muted-foreground"> · by admin</span>}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ToaTrainingPartnersPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaTrainingPartner>("/toa/admin/tps");
  const count = (status: Tab) => (status === "all" ? data.length : data.filter((tp) => tp.status === status).length);
  const rows = data
    .filter((tp) => tab === "all" || tp.status === tab)
    .filter((tp) => matches(search, tp.organizationName, tp.tpCode, tp.email, tp.contactPerson));

  return (
    <>
      <PageHeader
        title="ToA training partners"
        description="RailTel Training of Assessors partners. Only CUTM creates these accounts; they are separate from skill-scheme training partners."
        actions={<CreateTpDialog />}
      />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "active", label: "Active", count: count("active") },
                { value: "suspended", label: "Suspended", count: count("suspended") },
                { value: "deactivated", label: "Deactivated", count: count("deactivated") },
                { value: "all", label: "All", count: count("all") },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, code, email…" />
            </div>
          </>
        }
      >
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={TrainFront} title="No training partners here" description="Create a RailTel ToA training partner to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training partner</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last login</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tp) => (
                <TableRow key={tp._id}>
                  <TableCell>
                    <p className="font-medium">{tp.organizationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {tp.tpCode} · {tp.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p>{tp.contactPerson}</p>
                    <p className="text-xs text-muted-foreground">{tp.mobile}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_BADGE[tp.status]}
                      {isLocked(tp) && <Badge variant="destructive">Locked</Badge>}
                      {tp.mustChangePassword && tp.status === "active" && <Badge variant="outline">First login pending</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(tp.lastLoginAt)}</TableCell>
                  <TableCell className="text-right">
                    <TpSheet tp={tp} />
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
