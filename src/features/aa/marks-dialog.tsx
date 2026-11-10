"use client";

import { useState } from "react";
import { ClipboardPen, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Course, Exam, Student } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { calculateMarks, nosMax, type NosScore } from "@/lib/domain/grading";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// "25-October-2026" (how the backend stores the assessment date) to an ISO date.
export const examDateIso = (value?: string) => {
  if (!value) return null;
  const date = new Date(value.replace(/-/g, " "));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const PARTS: { key: keyof NosScore; label: string; max: "theoryMarks" | "practicalMarks" | "vivaMarks" }[] = [
  { key: "theory", label: "Theory", max: "theoryMarks" },
  { key: "practical", label: "Practical", max: "practicalMarks" },
  { key: "viva", label: "Viva", max: "vivaMarks" },
];

export function MarksDialog({ exam, student, course }: { exam: Exam; student: Student; course?: Course }) {
  const nosList = course?.Nos ?? [];
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<NosScore[]>([]);
  const upload = useApiMutation((body: Record<string, unknown>) => api.post("/marks/upload", body), `Marks saved for ${student.name}`);
  const examDate = examDateIso(exam.assesmentdate);
  const result = course ? calculateMarks(course, scores) : null;
  const overLimit = result?.rows.some((row) => PARTS.some((part) => row.score[part.key] > (row.nos[part.max] ?? 0)));

  // ** one score per NOS, even when the course arrived after the dialog was first rendered
  const setScore = (index: number, key: keyof NosScore, value: string) =>
    setScores((current) =>
      nosList.map((_, i) => {
        const score = current[i] ?? { theory: 0, practical: 0, viva: 0 };
        return i === index ? { ...score, [key]: Math.max(0, Number(value) || 0) } : score;
      })
    );

  const save = async () => {
    if (!result || !examDate) return;
    await upload.mutateAsync({
      examId: exam._id,
      studentId: student._id,
      studentAttendance: true,
      examDate,
      centerCode: exam.CenterCode,
      studentDOB: student.dob,
      Nos: result.rows.map((row) => ({
        name: row.nos.description,
        nosType: row.nos.nosType,
        code: row.nos.code,
        Theory: row.score.theory,
        Practical: row.score.practical,
        Viva: row.score.viva,
        Total: row.max,
        passMark: row.passMark,
        MarksObtained: row.obtained,
      })),
      total: result.totalObtained,
      totalTheorymark: result.theory,
      totalPracticalMark: result.practical,
      totalVivaMark: result.viva,
      Grade: result.grade,
      Result: result.result,
    });
    setOpen(false);
  };

  const blocked = !course ? "The course of this exam has no NOS set up" : !examDate ? "Set the assessment date first" : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !upload.isPending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={Boolean(blocked)} title={blocked ?? undefined}>
          <ClipboardPen />
          Enter marks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] p-0 sm:max-w-3xl">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <DialogTitle>Marks for {student.name}</DialogTitle>
            <DialogDescription>
              MPR {student.MPR_Id} · {course?.courseName}. Marks cannot be changed after saving.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 px-6 py-4">
              {result?.rows.map((row, index) => (
                <div key={row.nos.code} className={cn("rounded-xl border p-4", !row.passed && "border-destructive/30 bg-destructive/[0.03]")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{row.nos.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.nos.code} · {row.nos.nosType}
                        {row.passMark ? ` · pass mark ${row.passMark}` : ""}
                      </p>
                    </div>
                    <Badge variant={row.passed ? "success" : "destructive"} className="tabular-nums">
                      {row.obtained} / {row.max}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {PARTS.map((part) => {
                      const max = row.nos[part.max] ?? 0;
                      const value = row.score[part.key];
                      return (
                        <label key={part.key} className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {part.label} <span className="tabular-nums">/ {max}</span>
                          </span>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            disabled={max === 0}
                            value={value || ""}
                            placeholder="0"
                            onChange={(event) => setScore(index, part.key, event.target.value)}
                            aria-invalid={value > max}
                            className="tabular-nums"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {nosList.length > 0 && result && (
                <p className="text-xs text-muted-foreground">Total possible: {nosList.reduce((sum, nos) => sum + nosMax(nos), 0)} marks.</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {result && (
              <div className="flex items-center gap-3 text-sm">
                <span className="tabular-nums">
                  <span className="font-semibold">{result.totalObtained}</span> / {result.totalMax} ({result.percentage}%)
                </span>
                <Badge variant={result.result === "Pass" ? "success" : "destructive"}>
                  {result.result} · Grade {result.grade}
                </Badge>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={upload.isPending}>
                Cancel
              </Button>
              <Button onClick={save} disabled={upload.isPending || Boolean(overLimit)}>
                {upload.isPending && <Loader2 className="animate-spin" />}
                Save marks
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
