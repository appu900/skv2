"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import type { Exam } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { examStage } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { StatusTabs } from "@/components/shared/status-tabs";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgency } from "./use-agency";

type Tab = "todo" | "submitted" | "certified" | "all";

const tabOf = (exam: Exam): Exclude<Tab, "all"> => {
  if (exam.certificateIssued) return "certified";
  if (exam.markUploadAndExamCompleteStatus) return "submitted";
  return "todo";
};

export function AgencyExamsPage() {
  const { aaId } = useAgency();
  const [tab, setTab] = useState<Tab>("todo");
  const [search, setSearch] = useState("");
  const exams = useList<Exam>(aaId ? `/exam/aa/${aaId}` : null);

  const list = exams.data ?? [];
  const count = (value: Exclude<Tab, "all">) => list.filter((exam) => tabOf(exam) === value).length;
  const rows = list
    .filter((exam) => tab === "all" || tabOf(exam) === tab)
    .filter((exam) => matches(search, exam.batchABN, exam.course, exam.TrainingOrganization, exam.CenterName));

  return (
    <>
      <PageHeader title="Exams" description="Batches assigned to you. Open one to assign an assessor, schedule it, record attendance and upload marks." />
      <ListCard
        toolbar={
          <>
            <StatusTabs<Tab>
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "todo", label: "To do", count: count("todo") },
                { value: "submitted", label: "Results submitted", count: count("submitted") },
                { value: "certified", label: "Certified", count: count("certified") },
                { value: "all", label: "All", count: list.length },
              ]}
            />
            <div className="sm:ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search ABN, course, partner…" />
            </div>
          </>
        }
      >
        {!aaId || exams.isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No exams here" description="The awarding body assigns paid batches to you; they appear in this list." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden lg:table-cell">Centre</TableHead>
                <TableHead className="hidden sm:table-cell">Candidates</TableHead>
                <TableHead className="hidden xl:table-cell">Assessment date</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((exam) => (
                <TableRow key={exam._id}>
                  <TableCell>
                    <Link href={`/aa/exams/${exam._id}`} className="font-medium hover:text-primary hover:underline">
                      {exam.batchABN}
                    </Link>
                    <p className="text-xs text-muted-foreground">{exam.course}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{exam.TrainingOrganization}</TableCell>
                  <TableCell className="hidden lg:table-cell">{exam.CenterName}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {exam.presentStudents !== undefined ? `${exam.presentStudents}/${exam.totalStudents ?? 0}` : exam.totalStudents ?? 0}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{exam.assesmentdate ?? "Not scheduled"}</TableCell>
                  <TableCell>
                    <StageBadge stage={examStage(exam)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/aa/exams/${exam._id}`}>
                        Open
                        <ArrowRight />
                      </Link>
                    </Button>
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
