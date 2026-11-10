"use client";

import { useState } from "react";
import { MapPinned, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Scheme, SnaAccount } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function CreateSnaDialog() {
  const schemes = useList<Scheme>("/scheme");
  const create = useApiMutation((body: Record<string, FormDataEntryValue | null>) => api.post("/sna", body), "SNA account created");
  const governmentSchemes = (schemes.data ?? []).filter((scheme) => scheme.schemeType !== "Corporate");
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          New SNA account
        </Button>
      }
      title="Create an SNA account"
      description="The SNA approves centres and batches of one scheme in one state."
      submitLabel="Create account"
      onSubmit={(form) =>
        create.mutateAsync({
          scheme: form.get("scheme"),
          schemetype: form.get("schemetype"),
          state: form.get("state"),
          email: form.get("email"),
          password: form.get("password"),
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Scheme" name="scheme" required options={governmentSchemes.map((scheme) => scheme.name)} />
        <SelectField label="Scheme type" name="schemetype" required options={["State Government", "Central Government"]} />
        <SelectField label="State" name="state" required options={STATES} className="sm:col-span-2" />
        <Field label="Login email" name="email" type="email" required autoComplete="off" />
        <Field label="Password" name="password" type="password" required minLength={6} autoComplete="new-password" />
      </div>
    </FormDialog>
  );
}

export function SnaPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<SnaAccount>("/sna/all");
  const rows = data.filter((sna) => matches(search, sna.email, sna.scheme, sna.state));

  return (
    <>
      <PageHeader title="SNA accounts" description="State nodal agency logins, one per scheme and state." actions={<CreateSnaDialog />} />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search email, scheme, state…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={MapPinned} title="No SNA accounts" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Login</TableHead>
                <TableHead>Scheme</TableHead>
                <TableHead className="hidden sm:table-cell">State</TableHead>
                <TableHead className="hidden md:table-cell text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((sna) => (
                <TableRow key={sna._id}>
                  <TableCell className="font-medium">{sna.email}</TableCell>
                  <TableCell>
                    <p>{sna.scheme}</p>
                    <Badge variant="outline" className="mt-1">
                      {sna.schemetype}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{sna.state}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground md:table-cell">{formatDate(sna.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
