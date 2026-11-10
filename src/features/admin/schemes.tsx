"use client";

import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Scheme } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { SCHEME_TYPES, STATES } from "@/lib/domain/states";
import { formatCurrency } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function CreateSchemeDialog() {
  // multipart: the logo file goes up as "image", the rest as text fields
  const create = useApiMutation((form: FormData) => api.post("/scheme", form), "Scheme created");
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          New scheme
        </Button>
      }
      title="Create a scheme"
      description="The logo is printed on certificates of this scheme."
      submitLabel="Create scheme"
      onSubmit={(form) => create.mutateAsync(form)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required placeholder="e.g. PMKVY 4.0" />
        <Field label="Code" name="code" required placeholder="e.g. PMKVY4" />
        <SelectField label="Type" name="schemeType" required options={SCHEME_TYPES} />
        <Field label="Project type" name="projectType" required placeholder="e.g. Short term training" />
        <SelectField label="State" name="state" required options={STATES} />
        <Field label="Price per candidate (₹)" name="pricePerStudent" type="number" min={0} step="1" required />
      </div>
      <Field label="Logo" name="image" type="file" accept="image/png,image/jpeg" required />
    </FormDialog>
  );
}

export function SchemesPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<Scheme>("/scheme");
  const rows = data.filter((scheme) => matches(search, scheme.name, scheme.code, scheme.state, scheme.schemeType));

  return (
    <>
      <PageHeader title="Schemes" description="Government and corporate schemes, with their price per candidate." actions={<CreateSchemeDialog />} />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search name, code, state…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Landmark} title="No schemes" description="Create the first scheme to let training partners use it." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Project type</TableHead>
                <TableHead className="hidden sm:table-cell">State</TableHead>
                <TableHead className="text-right">Price / candidate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((scheme) => (
                <TableRow key={scheme._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 rounded-md">
                        {scheme.logo && <AvatarImage src={scheme.logo} alt="" className="object-contain" />}
                        <AvatarFallback className="rounded-md text-xs">{scheme.code.slice(0, 3)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{scheme.name}</p>
                        <p className="text-xs text-muted-foreground">{scheme.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{scheme.schemeType}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{scheme.projectType}</TableCell>
                  <TableCell className="hidden sm:table-cell">{scheme.state}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(scheme.pricePerStudent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
