"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Batch, Centre, Course, Scheme } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { batchStage, formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField } from "@/components/shared/field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BatchManageSheet } from "./batch-manage";
import { useTrainingPartner } from "./use-training-partner";

type Tab = "all" | "draft" | "running" | "completed";

const tabOf = (batch: Batch): Exclude<Tab, "all"> => {
  const stage = batchStage(batch).label;
  if (stage === "Draft") return "draft";
  if (stage === "Completed") return "completed";
  return "running";
};

// A centre can run a scheme once it is approved there (by the SNA, or the LC/RC for corporate schemes).
function eligibleSchemes(centre: Centre | undefined, schemes: Scheme[]) {
  if (!centre) return [];
  return centre.schemes
    .map((entry) => ({ entry, scheme: schemes.find((scheme) => scheme.name === entry.schemeName) }))
    .filter(({ entry, scheme }) => scheme && entry.approveStatus)
    .map(({ scheme }) => scheme as Scheme);
}

function CreateBatchDialog({ centres, disabled }: { centres: Centre[]; disabled?: boolean }) {
  const schemes = useList<Scheme>("/scheme");
  const courses = useList<Course>("/course/course");
  const [centreId, setCentreId] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [courseId, setCourseId] = useState("");
  const create = useApiMutation((body: Record<string, unknown>) => api.post("/batch/create", body), (result) => {
    const abn = (result as { data?: { data?: Batch } }).data?.data?.ABN_Number;
    return abn ? `Batch ${abn} created` : "Batch created";
  });

  const centre = centres.find((item) => item._id === centreId);
  const allowedSchemes = eligibleSchemes(centre, schemes.data ?? []);
  const centreCourseIds = new Set(
    (centre?.sectors ?? []).flatMap((sector) => (typeof sector === "object" ? (sector.courses ?? []).map((course) => course._id) : []))
  );
  const courseOptions = (courses.data ?? []).filter((course) => centreCourseIds.size === 0 || centreCourseIds.has(course._id));
  const pendingSchemes = (centre?.schemes.length ?? 0) - allowedSchemes.length;

  const reset = () => {
    setCentreId("");
    setSchemeName("");
    setCourseId("");
  };

  return (
    <FormDialog
      wide
      trigger={
        <Button disabled={disabled}>
          <Plus />
          New batch
        </Button>
      }
      title="Create a batch"
      description="Pick the centre first; schemes and courses follow from it. You add candidates and trainers next."
      submitLabel="Create batch"
      onSubmit={async (form) => {
        const scheme = allowedSchemes.find((item) => item.name === schemeName);
        const course = courseOptions.find((item) => item._id === courseId);
        const startDate = String(form.get("startDate"));
        const endDate = String(form.get("endDate"));
        if (!centre || !scheme || !course) {
          toast.error("Choose a centre, scheme and course");
          throw new Error("incomplete");
        }
        if (endDate < startDate) {
          toast.error("The end date is before the start date");
          throw new Error("dates");
        }
        await create.mutateAsync({
          centerId: centre._id,
          centerName: centre.name,
          CenterCode: centre.centerId,
          state: centre.state,
          scheme: scheme.name,
          schemeType: scheme.schemeType,
          courseName: course.courseName,
          courseCode: course.courseCode,
          sectorName: course.sectorName,
          courseDuration: course.duration,
          courseLevel: course.ncrfLevel !== undefined ? String(course.ncrfLevel) : undefined,
          courseCredit: course.totalCredit !== undefined ? String(course.totalCredit) : undefined,
          startDate,
          endDate,
        });
        reset();
      }}
    >
      <SelectField
        label="Centre"
        name="centre"
        required
        value={centreId}
        onValueChange={(value) => {
          setCentreId(value);
          setSchemeName("");
          setCourseId("");
        }}
        options={centres.map((item) => ({ value: item._id, label: `${item.name} (${item.centerId}) · ${item.state}` }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Scheme"
          name="scheme"
          required
          value={schemeName}
          onValueChange={setSchemeName}
          placeholder={centre ? "Select…" : "Pick a centre first"}
          options={allowedSchemes.map((scheme) => ({ value: scheme.name, label: `${scheme.name} · ${scheme.schemeType}` }))}
          hint={pendingSchemes > 0 ? `${pendingSchemes} scheme(s) of this centre still wait for approval` : undefined}
        />
        <SelectField
          label="Course"
          name="course"
          required
          value={courseId}
          onValueChange={setCourseId}
          placeholder={centre ? "Select…" : "Pick a centre first"}
          options={courseOptions.map((course) => ({ value: course._id, label: `${course.courseName} (${course.courseCode})` }))}
        />
        <Field label="Training starts" name="startDate" type="date" required />
        <Field label="Training ends" name="endDate" type="date" required />
      </div>
      {centre && allowedSchemes.length === 0 && (
        <Alert>
          <AlertDescription>None of this centre&apos;s schemes is approved yet, so no batch can be created here.</AlertDescription>
        </Alert>
      )}
    </FormDialog>
  );
}

export function BatchesPage() {
  const { tpId, approved } = useTrainingPartner();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const batches = useList<Batch>(tpId ? `/batch/tp/${tpId}` : null);
  const centres = useList<Centre>(tpId ? `/center/tp/${tpId}` : null);

  const list = batches.data ?? [];
  const count = (value: Exclude<Tab, "all">) => list.filter((batch) => tabOf(batch) === value).length;
  const rows = list
    .filter((batch) => tab === "all" || tabOf(batch) === tab)
    .filter((batch) => matches(search, batch.ABN_Number, batch.courseName, batch.centerName, batch.scheme));

  return (
    <>
      <PageHeader
        title="Batches"
        description="Create a batch, add candidates (with photos) and trainers, then submit it for assessment."
        actions={<CreateBatchDialog centres={centres.data ?? []} disabled={!approved} />}
      />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "all", label: "All", count: list.length },
                { value: "draft", label: "Draft", count: count("draft") },
                { value: "running", label: "In progress", count: count("running") },
                { value: "completed", label: "Completed", count: count("completed") },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, course, centre…" />
            </div>
          </>
        }
      >
        {!tpId || batches.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Layers} title="No batches here" description="Batches you create show up in this list." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Centre</TableHead>
                <TableHead className="hidden lg:table-cell">Scheme</TableHead>
                <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                <TableHead className="hidden xl:table-cell">Training</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>
                    <Link href={`/tp/batches/${batch._id}`} className="font-medium hover:text-primary hover:underline">
                      {batch.courseName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{batch.ABN_Number || "—"}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{batch.centerName}</TableCell>
                  <TableCell className="hidden lg:table-cell">{batch.scheme}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{batch.students?.length || 0}</TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={batchStage(batch)} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tp/batches/${batch._id}`}>
                        <Eye />
                        Open
                      </Link>
                    </Button>
                    <BatchManageSheet batch={batch} />
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
