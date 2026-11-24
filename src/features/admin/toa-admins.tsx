"use client";

import { useState } from "react";
import { KeyRound, LockOpen, Plus, TrainFront } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ToaAdminAccount } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field, TextareaField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ENDPOINT = "/toa/accounts";

function CreateToaAdminDialog() {
  const create = useApiMutation((body: Record<string, FormDataEntryValue | null>) => api.post(ENDPOINT, body), "ToA admin created, login details are emailed");
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          New ToA admin
        </Button>
      }
      title="Create a RailTel ToA admin"
      description="A temporary password is emailed with the ToA admin login link; it must be changed at the first login. ToA admins run the whole ToA module and see nothing else."
      submitLabel="Create and email login"
      onSubmit={(form) => create.mutateAsync({ name: form.get("name"), email: form.get("email"), mobile: form.get("mobile") || null })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required className="sm:col-span-2" />
        <Field label="Login email" name="email" type="email" required autoComplete="off" />
        <Field label="Mobile" name="mobile" type="tel" pattern="[6-9][0-9]{9}" title="10 digit mobile number" />
      </div>
    </FormDialog>
  );
}

function ResetPassword({ account }: { account: ToaAdminAccount }) {
  const reset = useApiMutation(() => api.put(`${ENDPOINT}/${account._id}/reset-password`), `New temporary password emailed to ${account.email}`);
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm">
          <KeyRound />
          Reset password
        </Button>
      }
      title={`Reset the password of ${account.name}?`}
      description={`A new temporary password is emailed to ${account.email}. Open sessions end and the old password stops working.`}
      confirmLabel="Reset and email"
      onConfirm={() => reset.mutateAsync(undefined)}
    />
  );
}

function Unlock({ account }: { account: ToaAdminAccount }) {
  const unlock = useApiMutation(() => api.put(`${ENDPOINT}/${account._id}/unlock`), "Account unlocked");
  return (
    <Button variant="ghost" size="sm" disabled={unlock.isPending} onClick={() => unlock.mutate(undefined)}>
      <LockOpen />
      Unlock
    </Button>
  );
}

function Deactivate({ account }: { account: ToaAdminAccount }) {
  const change = useApiMutation((reason: string) => api.put(`${ENDPOINT}/${account._id}/status`, { status: "deactivated", reason }), `${account.name} deactivated`);
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Deactivate
        </Button>
      }
      title={`Deactivate ${account.name}?`}
      description="They are signed out at once and can no longer log in. Nothing they did in the ToA module is changed."
      submitLabel="Deactivate"
      onSubmit={(form) => change.mutateAsync(String(form.get("reason") ?? ""))}
    >
      <TextareaField label="Reason" name="reason" required />
    </FormDialog>
  );
}

function Activate({ account }: { account: ToaAdminAccount }) {
  const change = useApiMutation(() => api.put(`${ENDPOINT}/${account._id}/status`, { status: "active" }), `${account.name} is active again`);
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm">
          Activate
        </Button>
      }
      title={`Activate ${account.name}?`}
      description="They can log in again with their current password."
      confirmLabel="Activate"
      onConfirm={() => change.mutateAsync(undefined)}
    />
  );
}

const STATUS: Record<ToaAdminAccount["status"], React.ReactNode> = {
  active: <Badge variant="success">Active</Badge>,
  suspended: <Badge variant="warning">Suspended</Badge>,
  deactivated: <Badge variant="outline">Deactivated</Badge>,
};

// The CUTM admin only creates the ToA admin logins; the ToA module itself is run from /toa-admin.
export function ToaAdminAccountsPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<ToaAdminAccount>(ENDPOINT);
  const rows = data.filter((account) => matches(search, account.name, account.email, account.mobile));

  return (
    <>
      <PageHeader
        title="RailTel ToA admins"
        description="Separate logins that run the RailTel Training of Assessors module at /login/toa-admin. They see only ToA; you no longer see ToA data here."
        actions={<CreateToaAdminDialog />}
      />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search name, email, mobile…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={TrainFront} title="No ToA admins yet" description="Create one to hand over the RailTel ToA module." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last login</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account) => {
                const locked = Boolean(account.lockUntil && new Date(account.lockUntil) > new Date());
                return (
                  <TableRow key={account._id}>
                    <TableCell>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.email}
                        {account.mobile ? ` · ${account.mobile}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {STATUS[account.status]}
                        {locked && <Badge variant="destructive">Locked</Badge>}
                        {account.mustChangePassword && account.status === "active" && <Badge variant="outline">Temporary password</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{account.lastLoginAt ? formatDate(account.lastLoginAt) : "Never"}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(account.createdAt)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {locked && <Unlock account={account} />}
                      <ResetPassword account={account} />
                      {account.status === "active" ? <Deactivate account={account} /> : <Activate account={account} />}
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
