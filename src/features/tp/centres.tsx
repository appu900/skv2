"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, School } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Centre, CentreSector, Scheme, Sector } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { STATES } from "@/lib/domain/states";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { CheckboxGroup, Field, SelectField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrainingPartner } from "./use-training-partner";

const populatedSectors = (centre: Centre) =>
  (centre.sectors ?? []).filter((sector): sector is CentreSector => typeof sector === "object");

// Government schemes are approved by the SNA, corporate schemes by the LC/RC.
function SchemeBadges({ centre, schemes }: { centre: Centre; schemes: Scheme[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {centre.schemes.map((entry) => {
        const corporate = schemes.find((scheme) => scheme.name === entry.schemeName)?.schemeType === "Corporate";
        if (entry.rejectStatus) {
          return (
            <Badge key={entry.schemeName} variant="destructive" title={entry.rejectReason}>
              {entry.schemeName}
              <span className="font-normal opacity-80">· rejected</span>
            </Badge>
          );
        }
        return (
          <Badge key={entry.schemeName} variant={entry.approveStatus ? "success" : "warning"}>
            {entry.schemeName}
            <span className="font-normal opacity-80">· {entry.approveStatus ? "approved" : corporate ? "awaiting LC/RC" : "awaiting SNA"}</span>
          </Badge>
        );
      })}
    </div>
  );
}

function CreateCentreDialog({ schemes, sectors, disabled }: { schemes: Scheme[]; sectors: Sector[]; disabled?: boolean }) {
  const create = useApiMutation((form: FormData) => api.post("/center", form), "Centre created and sent for approval");

  return (
    <FormDialog
      wide
      trigger={
        <Button disabled={disabled}>
          <Plus />
          New centre
        </Button>
      }
      title="Add a training centre"
      description="Each scheme you pick is sent to that state's SNA for approval."
      submitLabel="Create centre"
      onSubmit={async (form) => {
        if (!form.getAll("schemes").length) {
          toast.error("Pick at least one scheme");
          throw new Error("no scheme");
        }
        const body = new FormData();
        for (const key of ["name", "centerId", "projectId", "PRN_NO", "state"]) body.append(key, String(form.get(key) ?? ""));
        form.getAll("schemes").forEach((scheme, index) => body.append(`schemes[${index}][schemeName]`, String(scheme)));
        form.getAll("sectors").forEach((sector) => body.append("sectors[]", String(sector)));
        body.append("letter", form.get("letter") as File);
        await create.mutateAsync(body);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Centre name" name="name" required />
        <Field label="Centre code" name="centerId" required hint="Printed on certificates" />
        <Field label="Project ID" name="projectId" required />
        <Field label="PRN number" name="PRN_NO" required />
        <SelectField label="State" name="state" required options={STATES} />
        <Field label="Sanction order letter" name="letter" type="file" accept=".pdf,image/*" required />
      </div>
      <CheckboxGroup
        label="Schemes"
        name="schemes"
        required
        options={schemes.map((scheme) => ({ value: scheme.name, label: scheme.name, description: `${scheme.schemeType} · ${scheme.state}` }))}
        emptyText="No schemes have been created yet"
      />
      <CheckboxGroup label="Sectors" name="sectors" options={sectors.map((sector) => ({ value: sector._id, label: sector.name }))} />
    </FormDialog>
  );
}

function EditCentreDialog({ centre, sectors }: { centre: Centre; sectors: Sector[] }) {
  const update = useApiMutation((body: Record<string, unknown>) => api.put(`/center/update/${centre._id}`, body), "Centre updated");
  const current = populatedSectors(centre).map((sector) => sector._id);

  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil />
          Edit
        </Button>
      }
      title={`Edit ${centre.name}`}
      description="State, PRN and schemes are fixed once the centre is created."
      onSubmit={(form) =>
        update.mutateAsync({
          name: form.get("name"),
          centerId: form.get("centerId"),
          projectId: form.get("projectId"),
          sectors: form.getAll("sectors"),
        })
      }
    >
      <Field label="Centre name" name="name" required defaultValue={centre.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Centre code" name="centerId" required defaultValue={centre.centerId} />
        <Field label="Project ID" name="projectId" required defaultValue={centre.projectId} />
      </div>
      <CheckboxGroup
        label="Sectors"
        name="sectors"
        defaultValues={current}
        options={sectors.map((sector) => ({ value: sector._id, label: sector.name }))}
      />
    </FormDialog>
  );
}

function CentreSheet({ centre, schemes }: { centre: Centre; schemes: Scheme[] }) {
  const sectors = populatedSectors(centre);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          View
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{centre.name}</SheetTitle>
          <SheetDescription>
            {centre.centerId} · {centre.state}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <DetailList
            items={[
              ["Centre code", centre.centerId],
              ["Project ID", centre.projectId],
              ["PRN number", centre.PRN_NO],
              ["State", centre.state],
            ]}
          />
          <FileLink href={centre.sanction_order_letter} label="Sanction order letter" />
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Scheme approvals</h3>
            <SchemeBadges centre={centre} schemes={schemes} />
            {centre.schemes
              .filter((entry) => entry.rejectStatus)
              .map((entry) => (
                <p key={entry.schemeName} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                  <span className="font-medium">{entry.schemeName} rejected:</span> {entry.rejectReason}
                </p>
              ))}
          </section>
          <Separator />
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Sectors and courses</h3>
            {sectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sectors linked yet.</p>
            ) : (
              sectors.map((sector) => (
                <div key={sector._id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{sector.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(sector.courses ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">No courses</span>
                    ) : (
                      sector.courses?.map((course) => (
                        <Badge key={course._id} variant="outline">
                          {course.courseName}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CentresPage() {
  const { tpId, approved } = useTrainingPartner();
  const [search, setSearch] = useState("");
  const centres = useList<Centre>(tpId ? `/center/tp/${tpId}` : null);
  const schemes = useList<Scheme>("/scheme");
  const sectors = useList<Sector>("/sector/all");

  const rows = (centres.data ?? []).filter((centre) => matches(search, centre.name, centre.centerId, centre.state));

  return (
    <>
      <PageHeader
        title="Centres"
        description="Your training centres and the approval of each scheme (SNA for government, LC/RC for corporate). Batches need an approved centre."
        actions={<CreateCentreDialog schemes={schemes.data ?? []} sectors={sectors.data ?? []} disabled={!approved} />}
      />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search centres…" />}>
        {!tpId || centres.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={School} title="No centres yet" description="Add a centre to start creating batches." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre</TableHead>
                <TableHead className="hidden md:table-cell">State</TableHead>
                <TableHead className="hidden sm:table-cell">Schemes</TableHead>
                <TableHead className="hidden lg:table-cell">Sectors</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((centre) => (
                <TableRow key={centre._id}>
                  <TableCell>
                    <p className="font-medium">{centre.name}</p>
                    <p className="text-xs text-muted-foreground">{centre.centerId}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{centre.state}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <SchemeBadges centre={centre} schemes={schemes.data ?? []} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{populatedSectors(centre).length}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <CentreSheet centre={centre} schemes={schemes.data ?? []} />
                    <EditCentreDialog centre={centre} sectors={sectors.data ?? []} />
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
