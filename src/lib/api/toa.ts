// Shapes returned by /toa/* (RailTel Training of Assessors module).

export type TraineeStatus = "draft" | "submitted" | "under_review" | "correction_required" | "approved" | "rejected";
export type BatchStatus = "draft" | "submitted" | "under_review" | "returned" | "approved" | "rejected" | "completed";
export type SessionStatus = "not_marked" | "draft" | "submitted" | "approved" | "returned";
export type AttendanceMark = "present" | "absent" | "leave";

export interface StatusEntry {
  status: string;
  remarks?: string;
  reference?: string;
  byRole?: string;
  at: string;
}

export interface TpRef {
  _id: string;
  organizationName: string;
  tpCode: string;
  email?: string;
}

export interface ToaTrainee {
  _id: string;
  registrationId: string;
  toaTpId: string | TpRef;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  experienceYears?: number;
  sector?: string;
  currentOrganisation?: string;
  designation?: string;
  address?: string;
  state?: string;
  idProofType?: string;
  idProofNumber?: string;
  documents: Partial<Record<"photo" | "idProof" | "qualificationCertificate" | "experienceProof", string | null>>;
  status: TraineeStatus;
  remarks?: string | null;
  submittedAt?: string | null;
  history: StatusEntry[];
  portalEnabled?: boolean;
  hasPassword?: boolean;
  updatedAt?: string;
}

export interface ToaSession {
  _id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  attendanceStatus: SessionStatus;
  evidenceKey?: string | null;
  attendanceRemarks?: string | null;
}

export interface ToaBatch {
  _id: string;
  batchCode: string;
  toaTpId: string | TpRef;
  programmeName: string;
  trainingMode: "Offline" | "Online" | "Hybrid";
  startDate: string;
  endDate: string;
  schedule?: string;
  trainerName?: string;
  trainerMobile?: string;
  trainerEmail?: string;
  trainerQualification?: string;
  venue?: string;
  meetingLink?: string;
  capacity: number;
  trainees: { trainee: string | (Pick<ToaTrainee, "_id" | "name" | "registrationId" | "email" | "mobile" | "status">); enrolledAt?: string }[];
  sessions: ToaSession[];
  status: BatchStatus;
  remarks?: string | null;
  submissionRef?: string | null;
  submittedAt?: string | null;
  history: StatusEntry[];
  resultsStatus: "not_started" | "draft" | "approved" | "published";
  updatedAt?: string;
}

export interface AttendanceMatrix {
  sessions: ToaSession[];
  approvedSessions: number;
  trainees: { trainee: { _id: string; name: string; registrationId: string }; statuses: Record<string, AttendanceMark | null>; present: number; percent: number | null }[];
}

export interface ToaInvoice {
  _id: string;
  invoiceNumber: string;
  batch?: { _id: string; batchCode: string; programmeName?: string } | null;
  toaTpId: string;
  payer: { organizationName?: string; tpCode?: string };
  lines: { description: string; quantity: number; rate: number; amount: number }[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
  invoiceDate: string;
  dueDate?: string;
  status: "unpaid" | "paid" | "cancelled" | "refunded";
  paidAt?: string | null;
  cancelReason?: string | null;
  payment?: { _id: string; status: string; receiptNumber?: string; paymentId?: string } | null;
}

export interface ToaPayment {
  _id: string;
  invoice: { _id: string; invoiceNumber: string; total: number; status: string; batch?: { batchCode: string } };
  toaTpId: string | TpRef;
  gateway: "razorpay" | "mock";
  orderId: string;
  paymentId?: string;
  amount: number;
  status: "created" | "pending" | "successful" | "failed" | "cancelled" | "refunded" | "duplicate";
  method?: string | null;
  failureReason?: string | null;
  verifiedAt?: string | null;
  receiptNumber?: string | null;
  refundReason?: string | null;
  createdAt: string;
}

export interface CheckoutOrder {
  gateway: "razorpay" | "mock";
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
}

export interface ToaResultRow {
  trainee: { _id: string; name: string; registrationId: string };
  attendancePercent: number | null;
  result: { _id: string; score: number; result: "Pass" | "Fail" | "Absent"; remarks?: string | null; status: string; withheldReason?: string | null } | null;
  certificate: ToaCertificate | null;
  eligible: boolean;
  blockers: string[];
}

export interface ToaResultGrid {
  batch: { _id: string; batchCode: string; programmeName: string; status: BatchStatus; resultsStatus: ToaBatch["resultsStatus"] };
  settings: { passMark: number; minAttendancePercent: number; paymentRequiredForCertificate: boolean };
  invoice: { status: string; invoiceNumber: string; total: number } | null;
  allSessionsApproved: boolean;
  rows: ToaResultRow[];
}

export interface ToaCertificate {
  _id: string;
  certificateNumber: string;
  verifyCode: string;
  trainee: string;
  batch: string;
  issueDate: string;
  status: "valid" | "revoked" | "reissued";
  statusReason?: string | null;
  replacedBy?: { certificateNumber: string } | null;
  snapshot: { name: string; registrationId: string; programmeName: string; batchCode: string; trainingPartner?: string; score?: number; result?: string };
}

export interface ToaDashboard {
  registrations: { total: number; draft: number; pending: number; correction: number; approved: number; rejected: number };
  batches: { total: number; draft: number; submitted: number; approved: number; completed: number; rejected: number };
  finance: { invoiced: number; collected: number; pending: number; refunded: number; unpaidInvoices: number };
  certification: { resultsPending: number; certificatesIssued: number };
  monthly: { month: string; certificates: number }[];
}

export interface ToaNotification {
  _id: string;
  title: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface ToaReportRow {
  trainingPartner: string;
  batchCode: string;
  programmeName: string;
  startDate: string;
  endDate: string;
  batchStatus: string;
  registrationId: string;
  name: string;
  attendance: number | "";
  invoiceNumber: string;
  paymentStatus: string;
  score: number | string;
  result: string;
  certificateNumber: string;
  certificateStatus: string;
}
