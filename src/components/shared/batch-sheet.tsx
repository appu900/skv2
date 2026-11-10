"use client";

import { Eye, UserRound, Users } from "lucide-react";
import type { Batch, Student, Trainer } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { batchStage, formatCurrency, formatDate } from "@/lib/domain/stages";
import { DetailList } from "@/components/shared/detail-list";
import { FileLink } from "@/components/shared/file-link";
import { LoadingRows } from "@/components/shared/loading-rows";
import { StageBadge } from "@/components/dashboard/stage-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function BatchDetails({ id }: { id: string }) {
  const { data: batch, isLoading } = useItem<Batch>(`/batch/${id}`);
  if (isLoading || !batch) return <LoadingRows rows={8} />;

  const students = batch.students.filter((student): student is Student => typeof student === "object");
  const trainers = (batch.trainers ?? []).filter((trainer): trainer is Trainer => typeof trainer === "object");

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="candidates">
          Candidates <Badge variant="secondary">{students.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="trainers">
          Trainers <Badge variant="secondary">{trainers.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
        <DetailList
          items={[
            ["Course", `${batch.courseName}${batch.courseCode ? ` (${batch.courseCode})` : ""}`],
            ["Sector", batch.sectorName],
            ["Level / credit", [batch.courseLevel, batch.courseCredit].filter(Boolean).join(" / ")],
            ["Duration", batch.courseDuration ? `${batch.courseDuration} hours` : null],
            ["Training partner", batch.trainingOrganization],
            ["Centre", `${batch.centerName}${batch.CenterCode ? ` (${batch.CenterCode})` : ""}`],
            ["Scheme", `${batch.scheme} · ${batch.schemeType}`],
            ["State", batch.state],
            ["Training period", `${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}`],
            ["Assessor", batch.assessorName],
          ]}
        />
        <Separator />
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Payment</h3>
          <DetailList
            items={[
              ["Amount", batch.amountToPaid ? formatCurrency(batch.amountToPaid) : null],
              ["Per candidate", batch.perStudentCost ? formatCurrency(batch.perStudentCost) : null],
              ["Transaction ID", batch.transactionId],
              ["Paid by", batch.paymentPublishedBy],
              ["Proof uploaded", batch.clientPaymentStatus ? "Yes" : "No"],
              ["Confirmed by admin", batch.paymentStatus ? "Yes" : "No"],
            ]}
          />
          <div className="flex flex-wrap gap-4">
            <FileLink href={batch.prePaymentInvoice} label="Pre-payment invoice" />
            <FileLink href={batch.postPaymentInvoice} label="Post-payment invoice" />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="candidates" className="mt-4">
        {students.length === 0 ? (
          <EmptyState icon={Users} title="No candidates yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead className="hidden sm:table-cell">MPR ID</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {student.profilepic && <AvatarImage src={student.profilepic} alt="" />}
                        <AvatarFallback className="text-xs">{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.redg_No}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{student.MPR_Id}</TableCell>
                  <TableCell className="text-right">
                    {student.absent ? (
                      <Badge variant="warning">Absent</Badge>
                    ) : student.Grade ? (
                      <Badge variant="success">Grade {student.Grade}</Badge>
                    ) : (
                      <Badge variant="outline">Enrolled</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="trainers" className="mt-4">
        {trainers.length === 0 ? (
          <EmptyState icon={UserRound} title="No trainers yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-right">Course</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((trainer) => (
                <TableRow key={trainer._id}>
                  <TableCell>
                    <p className="font-medium">{trainer.name}</p>
                    <p className="text-xs text-muted-foreground">{trainer.email}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{trainer.phoneNumber}</TableCell>
                  <TableCell className="text-right">{trainer.coursecode}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Slide-over with everything about one batch; data is only fetched when it opens.
export function BatchSheet({ batch, trigger }: { batch: Batch; trigger?: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <Eye />
            View
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{batch.ABN_Number || batch.courseName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <StageBadge stage={batchStage(batch)} />
            <span>{batch.trainingOrganization}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-6">
          <BatchDetails id={batch._id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
