"use client";

import { useState } from "react";
import { Briefcase, KeyRound, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { LcrcAccount } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function CreateLcrcDialog() {
  const create = useApiMutation(
    (body: Record<string, FormDataEntryValue | null>) => api.post("/lcrc", body),
    "LC/RC account created, login details are emailed"
  );
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          New LC/RC account
        </Button>
      }
      title="Create an LC/RC account"
      description="A password is generated and emailed to the address below with the login link. The LC/RC approves corporate centres, batches and results."
      submitLabel="Create and email login"
      onSubmit={(form) =>
        create.mutateAsync({ name: form.get("name"), email: form.get("email"), phone: form.get("phone"), region: form.get("region") })
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required className="sm:col-span-2" placeholder="e.g. Regional Centre Bhubaneswar" />
        <Field label="Login email" name="email" type="email" required autoComplete="off" />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Region" name="region" className="sm:col-span-2" placeholder="Optional, e.g. East" />
      </div>
    </FormDialog>
  );
}

function ResetPassword({ account }: { account: LcrcAccount }) {
  const reset = useApiMutation(() => api.put(`/lcrc/${account._id}/reset-password`), `New password emailed to ${account.email}`);
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm">
          <KeyRound />
          Reset password
        </Button>
      }
      title={`Reset the password of ${account.name}?`}
      description={`A new password is emailed to ${account.email}. The old one stops working immediately.`}
      confirmLabel="Reset and email"
      onConfirm={() => reset.mutateAsync(undefined)}
    />
  );
}

function ToggleActive({ account }: { account: LcrcAccount }) {
  const toggle = useApiMutation(
    () => api.put(`/lcrc/${account._id}`, { isActive: !account.isActive }),
    account.isActive ? `${account.name} deactivated` : `${account.name} activated`
  );
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" className={account.isActive ? "text-destructive hover:text-destructive" : undefined}>
          {account.isActive ? "Deactivate" : "Activate"}
        </Button>
      }
      title={account.isActive ? `Deactivate ${account.name}?` : `Activate ${account.name}?`}
      description={account.isActive ? "They can no longer log in. Nothing they approved is changed." : "They can log in again with their current password."}
      confirmLabel={account.isActive ? "Deactivate" : "Activate"}
      destructive={account.isActive}
      onConfirm={() => toggle.mutateAsync(undefined)}
    />
  );
}

export function LcrcAccountsPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<LcrcAccount>("/lcrc/all");
  const rows = data.filter((account) => matches(search, account.name, account.email, account.region));

  return (
    <>
      <PageHeader
        title="LC/RC accounts"
        description="Logins that approve corporate centres, batches and results. The login details are emailed when you create an account."
        actions={<CreateLcrcDialog />}
      />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search name, email, region…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Briefcase} title="No LC/RC accounts" description="Create one to hand corporate approvals to an LC/RC." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account) => (
                <TableRow key={account._id}>
                  <TableCell>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.email}
                      {account.phone ? ` · ${account.phone}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{account.region || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? "success" : "outline"}>{account.isActive ? "Active" : "Deactivated"}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(account.createdAt)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <ResetPassword account={account} />
                    <ToggleActive account={account} />
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
