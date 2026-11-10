// Shapes returned by /offline/* (offline wing: partners without a login, CUTM as the assessment agency).

export interface OfflineTp {
  _id: string;
  tpCode: string;
  category: "Corporate" | "Government";
  organizationName: string;
  organizationCategory?: string;
  dateOfIncorporation?: string;
  affiliation?: string;
  pan?: string;
  prnNo?: string;
  scheme?: string;
  schemeType?: string;
  centerId?: string;
  registeredOfficeAddress?: string;
  registeredOfficeCity?: string;
  registeredOfficeDist?: string;
  registeredOfficeState?: string;
  registeredOfficePin?: string;
  registeredOfficeEmail?: string;
  registeredOfficeMobile?: string;
  registeredOfficeTelephone?: string;
  registeredOfficeGst?: string;
  website?: string;
  headOwnerName?: string;
  headOwnerDob?: string;
  headOwnerMobile?: string;
  headOwnerEmail?: string;
  headOwnerQualification?: string;
  headOwnerPanNo?: string;
  headOwnerAadharNo?: string;
  projectContactPersonName?: string;
  projectContactPersonDesignation?: string;
  projectContactPersonMobile?: string;
  projectContactPersonEmail?: string;
  sector?: string[];
  courses?: string[];
  notes?: string;
  status: "active" | "inactive";
  batches?: number;
  publishedBatches?: number;
  createdAt?: string;
}

export interface OfflineAssessor {
  _id: string;
  assessorCode: string;
  name: string;
  email?: string;
  mobile: string;
  qualification?: string;
  experienceYears?: number;
  sectors: string[];
  idProofType?: string;
  idProofNumber?: string;
  address?: string;
  bloodGroup?: string;
  photoKey?: string | null;
  validTill?: string;
  status: "active" | "inactive";
}

export interface MarkComponent {
  key: string;
  label: string;
  max: number;
}

export interface OfflineBatch {
  _id: string;
  batchCode: string;
  tp: OfflineTp | string;
  externalBatchId?: string;
  scheme?: string;
  schemeType?: string;
  jobRole: string;
  qpCode?: string;
  nsqfLevel?: string;
  sector?: string;
  centreName?: string;
  centreAddress?: string;
  district?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  assessmentDate?: string;
  assessor?: OfflineAssessor | null;
  components: MarkComponent[];
  passPercent: number;
  attendanceSheetKey?: string | null;
  resultSheetKey?: string | null;
  status: "draft" | "assessed" | "published";
  publishedAt?: string | null;
  candidates?: number;
  passed?: number;
  createdAt?: string;
}

export interface OfflineCandidate {
  _id: string;
  enrollmentNumber: string;
  candidateId?: string;
  name: string;
  fatherName?: string;
  gender?: string;
  dob?: string;
  mobile?: string;
  category?: string;
  attendance: "present" | "absent" | null;
  marks: Record<string, number>;
  total: number | null;
  percentage: number | null;
  grade: string | null;
  result: "Pass" | "Fail" | "Absent" | null;
}

export interface OfflineCertificate {
  _id: string;
  certificateNumber: string;
  verifyCode: string;
  candidate: string;
  status: "valid" | "revoked";
  statusReason?: string | null;
  issueDate: string;
  snapshot: { name: string; enrollmentNumber: string; grade?: string; percentage?: number };
}

export interface OfflineTemplate {
  type: "certificate" | "attendance_sheet" | "result_sheet" | "id_card";
  custom: boolean;
  version: number;
  source: "partner_scheme" | "partner" | "scheme" | "default" | "built-in";
  html: string;
}
