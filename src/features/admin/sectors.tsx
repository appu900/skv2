"use client";

import { useState } from "react";
import { BookOpen, Eye, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Course, Nos, Sector } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = "sectors" | "courses";

function CreateSectorDialog() {
  const create = useApiMutation((body: { name: string; description: string }) => api.post("/sector", body), "Sector created");
  return (
    <FormDialog
      trigger={
        <Button variant="outline">
          <Plus />
          New sector
        </Button>
      }
      title="Create a sector"
      submitLabel="Create sector"
      onSubmit={(form) => create.mutateAsync({ name: String(form.get("name")), description: String(form.get("description") || "") })}
    >
      <Field label="Name" name="name" required placeholder="e.g. Automotive" />
      <TextareaField label="Description" name="description" rows={3} />
    </FormDialog>
  );
}

const EMPTY_NOS: Nos = { description: "", nosType: "Mandatory", code: "", credit: 0 };
const NOS_NUMBERS: [keyof Nos, string][] = [
  ["credit", "Credit"],
  ["theoryMarks", "Theory"],
  ["practicalMarks", "Practical"],
  ["vivaMarks", "Viva"],
  ["totalMarks", "Total"],
  ["nosWisePassPercentage", "Pass %"],
];

function CreateCourseDialog({ sectors }: { sectors: Sector[] }) {
  const [nos, setNos] = useState<Nos[]>([{ ...EMPTY_NOS }]);
  const create = useApiMutation((body: Record<string, unknown>) => api.post("/course/course", body), "Course created");
  const updateNos = (index: number, key: keyof Nos, value: string) =>
    setNos((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: key === "description" || key === "code" || key === "nosType" ? value : Number(value) } : row))
    );

  return (
    <FormDialog
      wide
      trigger={
        <Button>
          <Plus />
          New course
        </Button>
      }
      title="Create a course"
      description="The NOS (national occupational standards) define how a candidate is assessed."
      submitLabel="Create course"
      onSubmit={async (form) => {
        await create.mutateAsync({
          courseName: form.get("courseName"),
          courseCode: form.get("courseCode"),
          sectorName: form.get("sectorName"),
          description: form.get("description"),
          duration: Number(form.get("duration")),
          ncrfLevel: Number(form.get("ncrfLevel") || 0) || undefined,
          totalCredit: Number(form.get("totalCredit") || 0) || undefined,
          aggregatePercentage: Number(form.get("aggregatePercentage") || 0) || undefined,
          Nos: nos,
        });
        setNos([{ ...EMPTY_NOS }]);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course name" name="courseName" required />
        <Field label="Course code" name="courseCode" required />
        <SelectField label="Sector" name="sectorName" required options={sectors.map((sector) => sector.name)} />
        <Field label="Duration (hours)" name="duration" type="number" min={1} required />
        <Field label="NCRF level" name="ncrfLevel" type="number" min={0} step="0.5" />
        <Field label="Total credit" name="totalCredit" type="number" min={0} />
        <Field label="Aggregate pass %" name="aggregatePercentage" type="number" min={0} max={100} />
      </div>
      <TextareaField label="Description" name="description" rows={2} />
      <Separator />
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">NOS</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setNos((rows) => [...rows, { ...EMPTY_NOS }])}>
          <Plus />
          Add NOS
        </Button>
      </div>
      {nos.map((row, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">NOS {index + 1}</Badge>
            {nos.length > 1 && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setNos((rows) => rows.filter((_, i) => i !== index))} aria-label="Remove NOS">
                <Trash2 />
              </Button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Code" required value={row.code} onChange={(event) => updateNos(index, "code", event.target.value)} />
            <Input placeholder="Type (Mandatory / Optional)" required value={row.nosType} onChange={(event) => updateNos(index, "nosType", event.target.value)} />
            <Input placeholder="Description" required value={row.description} onChange={(event) => updateNos(index, "description", event.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {NOS_NUMBERS.map(([key, label]) => (
              <Input
                key={key}
                type="number"
                min={0}
                placeholder={label}
                aria-label={label}
                required={key === "credit"}
                value={row[key] === undefined || row[key] === 0 ? "" : String(row[key])}
                onChange={(event) => updateNos(index, key, event.target.value)}
              />
            ))}
          </div>
        </div>
      ))}
    </FormDialog>
  );
}

function CourseSheet({ course }: { course: Course }) {
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
          <SheetTitle>{course.courseName}</SheetTitle>
          <SheetDescription>
            {course.courseCode} · {course.sectorName}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <DetailList
            items={[
              ["Duration", `${course.duration} hours`],
              ["NCRF level", course.ncrfLevel],
              ["Total credit", course.totalCredit],
              ["Aggregate pass %", course.aggregatePercentage],
              ["Description", course.description],
            ]}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NOS</TableHead>
                <TableHead className="text-right">Theory</TableHead>
                <TableHead className="text-right">Practical</TableHead>
                <TableHead className="text-right">Viva</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(course.Nos ?? []).map((row) => (
                <TableRow key={row.code}>
                  <TableCell>
                    <p className="font-medium">{row.code}</p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.theoryMarks ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.practicalMarks ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.vivaMarks ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.totalMarks ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SectorsPage() {
  const [tab, setTab] = useState<Tab>("sectors");
  const [search, setSearch] = useState("");
  const sectors = useList<Sector>("/sector/all");
  const courses = useList<Course>("/course/course");

  const sectorRows = (sectors.data ?? []).filter((sector) => matches(search, sector.name, sector.description));
  const courseRows = (courses.data ?? []).filter((course) => matches(search, course.courseName, course.courseCode, course.sectorName));
  const loading = tab === "sectors" ? sectors.isLoading : courses.isLoading;

  return (
    <>
      <PageHeader
        title="Sectors & courses"
        description="Sectors group courses; courses define the NOS a candidate is assessed on."
        actions={
          <div className="flex gap-2">
            <CreateSectorDialog />
            <CreateCourseDialog sectors={sectors.data ?? []} />
          </div>
        }
      />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "sectors", label: "Sectors", count: sectors.data?.length },
                { value: "courses", label: "Courses", count: courses.data?.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} />
            </div>
          </>
        }
      >
        {loading ? (
          <LoadingRows />
        ) : tab === "sectors" ? (
          sectorRows.length === 0 ? (
            <EmptyState icon={BookOpen} title="No sectors" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectorRows.map((sector) => (
                  <TableRow key={sector._id}>
                    <TableCell className="font-medium">{sector.name}</TableCell>
                    <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">{sector.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{sector.courses?.length ?? 0}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : courseRows.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="hidden md:table-cell">Sector</TableHead>
                <TableHead className="hidden sm:table-cell">Duration</TableHead>
                <TableHead className="hidden lg:table-cell">NOS</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseRows.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>
                    <p className="font-medium">{course.courseName}</p>
                    <p className="text-xs text-muted-foreground">{course.courseCode}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{course.sectorName}</TableCell>
                  <TableCell className="hidden sm:table-cell">{course.duration} h</TableCell>
                  <TableCell className="hidden lg:table-cell">{course.Nos?.length ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <CourseSheet course={course} />
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
