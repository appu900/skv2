// Shapes of backend records, limited to the fields the UI reads.

export type ApplicationStatus = "Pending" | "Approved" | "Rejected";

export interface TrainingPartner {
  _id: string;
  organizationName: string;
  organizationCategory?: string;
  scheme?: string;
  schemeType?: string;
  tpCode?: string;
  centerId?: string;
  registeredOfficeAddress?: string;
  registeredOfficeCity?: string;
  registeredOfficeDist?: string;
  registeredOfficeState?: string;
  registeredOfficePin?: string;
  registeredOfficeMobile?: string;
  registeredOfficeEmail?: string;
  registeredOfficeGst?: string;
  website?: string;
  pan?: string;
  prnNo?: string;
  headOwnerName?: string;
  headOwnerMobile?: string;
  headOwnerEmail?: string;
  projectContactPersonName?: string;
  projectContactPersonMobile?: string;
  projectContactPersonEmail?: string;
  sector?: string[];
  courses?: string[];
  organizationCorporatePaymentFee?: number;
  applicationStatus: ApplicationStatus;
  editPermission?: boolean;
  centers?: string[];
  affiliation?: string;
  dateOfIncorporation?: string;
  registeredOfficeTelephone?: string;
  headOwnerDob?: string;
  headOwnerQualification?: string;
  projectContactPersonDesignation?: string;
  createdAt?: string;
}

export interface AssessmentAgency {
  _id: string;
  agencyName: string;
  email?: string;
  phoneNumber?: string;
  officeAddress?: string;
  communicationAddress?: string;
  websiteLink?: string;
  headOfTheOrganization?: string;
  SPOC_NAME?: string;
  SPOC_EMAIL?: string;
  SPOC_CONTACT_NO?: string;
  legalStatusOfTheOrganization?: string;
  COMPANY_PAN_NO?: string;
  COMPANY_GST_NO?: string;
  NO_OF_BRANCHES?: string;
  BRANCH_ADDRESS?: string;
  geographical_region?: string;
  state_Under_geographicalRegion?: string;
  total_no_of_certified_Assessor?: string;
  sectors?: string[];
  courses?: string[];
  LETTER_OF_NCVET?: string;
  logo?: string;
  paymentPercentage?: number;
  AccountNumber?: string;
  IFSC_Code?: string;
  BankName?: string;
  BranchName?: string;
  MICR_code?: string;
  AccountType?: string;
  applicationStatus: ApplicationStatus;
  createdAt?: string;
}

export interface Student {
  _id: string;
  name: string;
  MPR_Id: string;
  redg_No?: string;
  fathername?: string;
  gender?: string;
  dob?: string;
  mobile?: string;
  email?: string;
  district?: string;
  state?: string;
  profilepic?: string;
  absent?: boolean;
  Grade?: string;
  markUploadStatus?: boolean;
  SNA_Id?: string;
  mothername?: string;
  category?: string;
  religion?: string;
  nationality?: string;
  generalqualification?: string;
  address?: string;
  city?: string;
  pincode?: string;
  uid?: string;
  sector_name?: string;
  course?: string;
  module?: string;
  cenid?: string;
  traininstartdate?: string;
  trainingenddate?: string;
  trainingHours?: number;
  totalhours?: number;
  totaldays?: number;
  createdAt?: string;
}

export interface Trainer {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  coursecode?: string;
  sector?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  PAN_CARD_NO?: string;
  AADHAR_NO?: string;
  PRN_NO?: string;
  educationQualification_1?: string;
  certification_course?: string;
  relevant_industryExperience?: string;
  profilePic?: string;
  resultSheet?: string;
  batches?: string[];
}

export interface Batch {
  _id: string;
  ABN_Number?: string;
  courseName: string;
  courseCode?: string;
  courseDuration?: number;
  courseCredit?: string;
  courseLevel?: string;
  sectorName?: string;
  centerName: string;
  CenterCode?: string;
  scheme: string;
  schemeType: string;
  state: string;
  trainingOrganization: string;
  trainingOrganizationId?: string;
  startDate?: string;
  endDate?: string;
  students: (Student | string)[];
  trainers?: (Trainer | string)[];
  amountToPaid?: number;
  perStudentCost?: number;
  transactionId?: string;
  paymentPublishedBy?: string;
  prePaymentInvoice?: string;
  postPaymentInvoice?: string;
  modeOfPayment?: string;
  batchActivePermission?: boolean;
  approvedByGovernmentBody?: boolean;
  rejectedByGovernmentBody?: boolean;
  governmentRejectionReason?: string;
  clientPaymentStatus?: boolean;
  paymentStatus?: boolean;
  isAssigned?: boolean;
  certificateIssued?: boolean;
  assessorName?: string;
  createdAt?: string;
}

export interface CentreSector {
  _id: string;
  name: string;
  courses?: { _id: string; courseName: string }[];
}

export interface Centre {
  _id: string;
  name: string;
  state: string;
  centerId?: string;
  projectId?: string;
  PRN_NO?: string;
  sanction_order_letter?: string;
  sectors?: (CentreSector | string)[];
  trainingOrganizationId?: { organizationName?: string } | string;
  schemes: { schemeName: string; approveStatus: boolean; rejectStatus?: boolean; rejectReason?: string }[];
}

export interface Exam {
  _id: string;
  batchABN: string;
  batchId?: Batch | string;
  course: string;
  scheme?: string;
  state?: string;
  CenterName?: string;
  TrainingOrganization: string;
  assesmentAgency?: string;
  assesmentAgencyId?: string | { _id: string };
  assesmentdate?: string;
  totalStudents?: number;
  presentStudents?: number;
  perStudentCost?: number;
  AssessorId?: unknown;
  attendanceSheet?: string;
  resultSheet?: string;
  images?: string[];
  markUploadAndExamCompleteStatus?: boolean;
  certificateIssued?: boolean;
  certificateStatus?: "not-started" | "queued" | "processing" | "completed" | "failed";
  certificateError?: string;
  /** Why the admin or LC/RC sent the result back to the agency. */
  resultRejectionReason?: string | null;
  certificatesIssuedCount?: number;
  paymentStatus?: boolean;
  courseCode?: string;
  CenterCode?: string;
  sector?: string;
  status?: "not-started" | "completed";
  month?: string;
  year?: string;
  totalNoOfStudentAbsent?: number;
  createdAt?: string;
}

export interface Assessor {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  assesoraId: string;
  courseCode: string;
  sector: string;
  state?: string;
  dist?: string;
  city?: string;
  pincode?: string;
  experience?: string;
  education_qualification_1?: string;
  education_qualification_2?: string;
  education_qualification_3?: string;
  panNumber?: string;
  adharNumber?: string;
  profilePic?: string;
  resultSheet?: string;
}

export interface Mark {
  _id: string;
  studentName: string;
  studentRedgNo?: string;
  MPR_ID?: string;
  total: number;
  Grade: string;
  Result: "Pass" | "Fail";
  studentAttendance?: boolean;
}

export interface Certificate {
  _id: string;
  certificateCode: string;
  studentName: string;
  Enrolment_number: string;
  grade: string;
  qualification: string;
  DateOfIssue?: string;
}

export interface AgencyInvoice {
  _id: string;
  month: string;
  year: string;
  invoiceGenerateDate?: string;
  totalNoOfcandidates?: number;
  totalNoOfAssessedCandidates?: number;
  totalAmountToBePaid?: number;
  paidAmount?: number;
  paymentStatus?: boolean;
  transactionId?: string;
  invoicePdf?: string;
  Paymentpercentage?: number;
  examDetails?: {
    examId: string;
    batchAbn: string;
    tpname: string;
    amountToPaid: number;
    assesmentDate?: string;
    totalNoOfCandidates?: number;
    noOfAssessedCandidates?: number;
    costPerCandidate?: number;
  }[];
}

export interface Scheme {
  _id: string;
  name: string;
  code: string;
  schemeType: string;
  projectType: string;
  state: string;
  logo?: string;
  pricePerStudent?: number;
}

export interface Sector {
  _id: string;
  name: string;
  description?: string;
  courses?: string[];
}

export interface Nos {
  description: string;
  nosType: string;
  code: string;
  credit: number;
  theoryMarks?: number;
  practicalMarks?: number;
  vivaMarks?: number;
  totalMarks?: number;
  nosWisePassPercentage?: number;
}

export interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
  sectorName: string;
  description?: string;
  duration: number;
  ncrfLevel?: number;
  totalCredit?: number;
  aggregatePercentage?: number;
  Nos?: Nos[];
}

export interface SnaAccount {
  _id: string;
  email: string;
  scheme: string;
  schemetype: string;
  state: string;
  createdAt?: string;
}

export interface LcrcAccount {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  region?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ToaTrainingPartner {
  _id: string;
  tpCode: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  address?: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  status: "active" | "suspended" | "deactivated";
  statusReason?: string | null;
  mustChangePassword: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string | null;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  createdByAdmin: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface AuditLogEntry {
  _id: string;
  module: "core" | "toa";
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  note?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface Notice {
  _id: string;
  title: string;
  description: string;
  pdf?: string;
  expiredAt: string;
  createdAt?: string;
}
