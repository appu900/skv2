import type { Course, Nos } from "@/lib/api/models";

// Marks of one candidate are entered per NOS (national occupational standard) of the course.
// The backend stores what is calculated here, so the rules live in one place.

export interface NosScore {
  theory: number;
  practical: number;
  viva: number;
}

export interface MarksResult {
  rows: {
    nos: Nos;
    score: NosScore;
    max: number;
    obtained: number;
    passMark: number;
    passed: boolean;
  }[];
  totalMax: number;
  totalObtained: number;
  theory: number;
  practical: number;
  viva: number;
  percentage: number;
  grade: string;
  result: "Pass" | "Fail";
}

// Pass mark of the whole course when the course does not define one.
export const DEFAULT_PASS_PERCENTAGE = 50;

// Grade by overall percentage. Confirm the official scale with the awarding body before go-live.
export const GRADE_SCALE: { min: number; grade: string }[] = [
  { min: 90, grade: "A+" },
  { min: 80, grade: "A" },
  { min: 70, grade: "B" },
  { min: 60, grade: "C" },
  { min: 50, grade: "D" },
  { min: 0, grade: "E" },
];

export const nosMax = (nos: Nos) => nos.totalMarks || (nos.theoryMarks ?? 0) + (nos.practicalMarks ?? 0) + (nos.vivaMarks ?? 0);

export function calculateMarks(course: Course, scores: NosScore[]): MarksResult {
  const rows = (course.Nos ?? []).map((nos, index) => {
    const score = scores[index] ?? { theory: 0, practical: 0, viva: 0 };
    const max = nosMax(nos);
    const obtained = score.theory + score.practical + score.viva;
    const passMark = nos.nosWisePassPercentage ? Math.ceil((max * nos.nosWisePassPercentage) / 100) : 0;
    return { nos, score, max, obtained, passMark, passed: obtained >= passMark };
  });
  const totalMax = rows.reduce((sum, row) => sum + row.max, 0);
  const totalObtained = rows.reduce((sum, row) => sum + row.obtained, 0);
  const percentage = totalMax ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const passPercentage = course.aggregatePercentage || DEFAULT_PASS_PERCENTAGE;
  // ** a candidate passes on the aggregate and has to clear every NOS that has its own pass mark
  const result = percentage >= passPercentage && rows.every((row) => row.passed) ? "Pass" : "Fail";
  const grade = result === "Fail" ? "F" : (GRADE_SCALE.find((step) => percentage >= step.min)?.grade ?? "E");
  return {
    rows,
    totalMax,
    totalObtained,
    theory: rows.reduce((sum, row) => sum + row.score.theory, 0),
    practical: rows.reduce((sum, row) => sum + row.score.practical, 0),
    viva: rows.reduce((sum, row) => sum + row.score.viva, 0),
    percentage,
    grade,
    result,
  };
}
