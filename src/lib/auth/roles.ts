// Roles as issued by the backend inside the JWT (`role` claim).
export const ROLES = ["Admin", "TrainingPartner", "AssesmentAgency", "SNA", "LCRC", "ToaTrainingPartner", "ToaAssessor"] as const;
export type Role = (typeof ROLES)[number];

// URL segment used for each portal, e.g. /tp/batches.
export type PortalSlug = "admin" | "tp" | "aa" | "sna" | "lcrc" | "toa" | "toa-assessor";

export interface RoleConfig {
  role: Role;
  slug: PortalSlug;
  label: string;
  description: string;
  /** Backend login endpoint, relative to /api/v1. */
  loginPath: string;
  /** Field name the backend expects for the email. */
  emailField: string;
  /** SNA login also needs the scheme it belongs to. */
  needsScheme?: boolean;
  /** Public self registration page, when the role can sign up. */
  registerPath?: string;
  /** Portal has a "forgot password" flow (/forgot-password?portal=<slug>). */
  forgotPassword?: boolean;
}

export const ROLE_CONFIG: Record<PortalSlug, RoleConfig> = {
  admin: {
    role: "Admin",
    slug: "admin",
    label: "Admin",
    description: "Approvals, payments, exams and certificates",
    loginPath: "/admin/login",
    emailField: "email",
  },
  tp: {
    role: "TrainingPartner",
    slug: "tp",
    label: "Training Partner",
    description: "Centres, batches, candidates and payments",
    loginPath: "/tp/login",
    emailField: "registeredOfficeEmail",
    registerPath: "/register/training-partner",
  },
  aa: {
    role: "AssesmentAgency",
    slug: "aa",
    label: "Assessment Agency",
    description: "Assessments, marks, assessors and invoices",
    loginPath: "/aa/login",
    emailField: "email",
    registerPath: "/register/assessment-agency",
  },
  sna: {
    role: "SNA",
    slug: "sna",
    label: "State Nodal Agency",
    description: "Centre and batch approvals for your state and scheme",
    loginPath: "/sna/login",
    emailField: "email",
    needsScheme: true,
  },
  lcrc: {
    role: "LCRC",
    slug: "lcrc",
    label: "LC/RC",
    description: "Corporate centre, batch and result approvals",
    loginPath: "/lcrc/login",
    emailField: "email",
  },
  toa: {
    role: "ToaTrainingPartner",
    slug: "toa",
    label: "RailTel ToA",
    description: "Training of Assessors: accounts created by CUTM for RailTel training partners",
    loginPath: "/toa/tp/login",
    emailField: "email",
    forgotPassword: true,
  },
  "toa-assessor": {
    role: "ToaAssessor",
    slug: "toa-assessor",
    label: "RailTel ToA assessor",
    description: "Assessors trained under RailTel ToA: attendance, results and certificates",
    loginPath: "/toa/assessor/login",
    emailField: "email",
    forgotPassword: true,
  },
};

export const slugForRole = (role: Role): PortalSlug =>
  (Object.values(ROLE_CONFIG).find((config) => config.role === role) as RoleConfig).slug;

export const isPortalSlug = (value: string): value is PortalSlug => value in ROLE_CONFIG;
