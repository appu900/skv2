// Shapes returned by /analytics/* (MongoDB aggregation pipelines on the backend).

export interface KeyCount {
  key: string;
  count: number;
}

export interface NamedCount {
  name: string;
  batches?: number;
  candidates?: number;
  completed?: number;
  exams?: number;
}

export interface CourseResult {
  name: string;
  passed: number;
  failed: number;
}

export type MonthRow = { month: string } & Partial<Record<"batches" | "candidates" | "enrolled" | "certificates" | "exams" | "assessed", number>>;

interface ResultBlocks {
  results: KeyCount[];
  grades: KeyCount[];
  courseResults: CourseResult[];
}

export interface AdminAnalytics extends ResultBlocks {
  totals: {
    batches: number;
    candidates: number;
    revenue: number;
    certificates: number;
    passRate: number | null;
    trainingPartners: KeyCount[];
    agencies: KeyCount[];
  };
  monthly: MonthRow[];
  batchStages: KeyCount[];
  schemes: NamedCount[];
  states: NamedCount[];
  courses: NamedCount[];
  topPartners: NamedCount[];
  centres: KeyCount[];
  gender: KeyCount[];
}

export interface TrainingPartnerAnalytics extends ResultBlocks {
  totals: { batches: number; candidates: number; centres: number; trainers: number; certificates: number; passRate: number | null; feesPaid: number };
  monthly: MonthRow[];
  batchStages: KeyCount[];
  centres: NamedCount[];
  courses: NamedCount[];
  centreApprovals: KeyCount[];
  gender: KeyCount[];
}

export interface SnaAnalytics extends ResultBlocks {
  scope: { scheme: string; state: string };
  totals: { batches: number; candidates: number; certificates: number; passRate: number | null; partners: number };
  monthly: MonthRow[];
  batchStages: KeyCount[];
  centres: KeyCount[];
  topPartners: NamedCount[];
  courses: NamedCount[];
  gender: KeyCount[];
}

export interface AgencyAnalytics extends ResultBlocks {
  totals: {
    exams: number;
    candidates: number;
    assessed: number;
    certificates: number;
    assessors: number;
    passRate: number | null;
    earningsPaid: number;
    earningsUnpaid: number;
  };
  monthly: MonthRow[];
  examStages: KeyCount[];
  assessors: NamedCount[];
}

export interface LcrcAnalytics extends ResultBlocks {
  totals: {
    batches: number;
    candidates: number;
    certificates: number;
    passRate: number | null;
    partners: number;
    pendingCentres: number;
    pendingBatches: number;
    pendingResults: number;
  };
  monthly: MonthRow[];
  batchStages: KeyCount[];
  centres: KeyCount[];
  topPartners: NamedCount[];
  courses: NamedCount[];
  gender: KeyCount[];
}
