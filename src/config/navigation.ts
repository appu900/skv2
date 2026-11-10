import {
  Award,
  Banknote,
  Briefcase,
  Bell,
  Building,
  FileStack,
  IdCard,
  FileSpreadsheet,
  SlidersHorizontal,
  ScrollText,
  TrainFront,
  BookOpen,
  Building2,
  CalendarCheck,
  ChartColumn,
  ClipboardCheck,
  Landmark,
  Layers,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Megaphone,
  Receipt,
  School,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PortalSlug } from "@/lib/auth/roles";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** One line shown on the placeholder page until the feature is built. */
  summary: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Every page of every portal, grouped as it appears in the sidebar.
export const NAVIGATION: Record<PortalSlug, NavSection[]> = {
  admin: [
    {
      items: [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard, summary: "Counts of pending approvals, payments and running exams." },
      ],
    },
    {
      title: "Approvals",
      items: [
        { title: "Training partners", href: "/admin/training-partners", icon: Building2, summary: "Review, approve or reject training partner applications and set corporate fees." },
        { title: "Assessment agencies", href: "/admin/assessment-agencies", icon: ClipboardCheck, summary: "Review, approve or reject assessment agencies and set their payment percentage." },
      ],
    },
    {
      title: "Operations",
      items: [
        { title: "Batches", href: "/admin/batches", icon: Layers, summary: "All batches with filters by state, sector, course and training partner." },
        { title: "Payments", href: "/admin/payments", icon: Wallet, summary: "Confirm corporate and government batch payments, set corporate amounts." },
        { title: "Exams", href: "/admin/exams", icon: CalendarCheck, summary: "Assign paid batches to assessment agencies and follow exam progress." },
        { title: "Certificates", href: "/admin/certificates", icon: Award, summary: "Publish certificates for completed exams and follow the generation job." },
        { title: "Agency invoices", href: "/admin/invoices", icon: Receipt, summary: "Monthly assessment agency invoices and their payment status." },
      ],
    },
    {
      title: "Setup",
      items: [
        { title: "Schemes", href: "/admin/schemes", icon: Landmark, summary: "Create schemes with logo, type and price per candidate." },
        { title: "Sectors & courses", href: "/admin/sectors", icon: BookOpen, summary: "Manage sectors and the courses (with NOS) under them." },
        { title: "Certificate formats", href: "/admin/certificate-formats", icon: Award, summary: "Certificate format per training partner and scheme." },
        { title: "SNA accounts", href: "/admin/sna", icon: MapPinned, summary: "Create and list State Nodal Agency accounts." },
        { title: "LC/RC accounts", href: "/admin/lcrc", icon: Briefcase, summary: "Create LC/RC logins for corporate approvals; credentials are emailed." },
        { title: "Notifications", href: "/admin/notifications", icon: Megaphone, summary: "Publish notices shown on the public site." },
        { title: "Admins", href: "/admin/admins", icon: ShieldCheck, summary: "Create additional admin accounts." },
      ],
    },
    {
      title: "Offline partners",
      items: [
        { title: "Offline training partners", href: "/admin/offline", icon: Building, summary: "Partners CUTM serves offline: no login, CUTM enters their batches." },
        { title: "Offline batches", href: "/admin/offline/batches", icon: FileStack, summary: "Candidates, assessment, sheets and certificates of offline partners." },
        { title: "CUTM assessors", href: "/admin/offline/assessors", icon: IdCard, summary: "CUTM's own assessors and their ID cards." },
        { title: "Document formats", href: "/admin/offline/templates", icon: ScrollText, summary: "Certificate, attendance sheet, result sheet and ID card per partner and scheme." },
      ],
    },
    {
      title: "RailTel ToA",
      items: [
        { title: "ToA overview", href: "/admin/toa", icon: ChartColumn, summary: "Registrations, batches, money and certificates of the ToA programme." },
        { title: "ToA training partners", href: "/admin/toa/training-partners", icon: TrainFront, summary: "Create, suspend and unlock RailTel ToA training partner accounts." },
        { title: "Assessor applications", href: "/admin/toa/assessors", icon: UserRound, summary: "Verify, return or reject assessors registered by ToA partners." },
        { title: "ToA batches", href: "/admin/toa/batches", icon: Layers, summary: "Approve batches and attendance, enter and publish results." },
        { title: "ToA payments", href: "/admin/toa/payments", icon: Wallet, summary: "Invoices, online payments, receipts and refunds." },
        { title: "ToA certificates", href: "/admin/toa/certificates", icon: Award, summary: "Issued certificates; correct, reissue or revoke." },
        { title: "ToA reports", href: "/admin/toa/reports", icon: FileSpreadsheet, summary: "Filterable report with Excel and PDF export." },
        { title: "ToA settings", href: "/admin/toa/settings", icon: SlidersHorizontal, summary: "Fees, eligibility rules and document templates." },
        { title: "ToA audit log", href: "/admin/toa/audit-log", icon: ScrollText, summary: "Every login, change and approval in the ToA module." },
      ],
    },
  ],
  tp: [
    {
      items: [
        { title: "Dashboard", href: "/tp", icon: LayoutDashboard, summary: "Application status, batches, candidates and pending payments at a glance." },
      ],
    },
    {
      title: "Training",
      items: [
        { title: "Centres", href: "/tp/centres", icon: School, summary: "Create centres, update details and see SNA approval per scheme." },
        { title: "Batches", href: "/tp/batches", icon: Layers, summary: "Create batches, add candidates and trainers, submit for assessment." },
        { title: "Trainers", href: "/tp/trainers", icon: UserRound, summary: "Trainer records and result sheets." },
      ],
    },
    {
      title: "Finance & results",
      items: [
        { title: "Payments", href: "/tp/payments", icon: Wallet, summary: "Batch fees, upload payment proof and track approval." },
        { title: "Results & certificates", href: "/tp/results", icon: Award, summary: "Marksheets and certificates of completed batches." },
      ],
    },
    {
      title: "Account",
      items: [{ title: "Profile", href: "/tp/profile", icon: Settings, summary: "Organisation details, sectors, courses and login email." }],
    },
  ],
  aa: [
    {
      items: [
        { title: "Dashboard", href: "/aa", icon: LayoutDashboard, summary: "Assigned exams, upcoming assessments and invoice status." },
      ],
    },
    {
      title: "Assessments",
      items: [
        { title: "Exams", href: "/aa/exams", icon: CalendarCheck, summary: "Assigned batches: schedule, assessor, attendance, marks and documents." },
        { title: "Assessors", href: "/aa/assessors", icon: Users, summary: "Add assessors and upload their mark sheets." },
      ],
    },
    {
      title: "Finance",
      items: [
        { title: "Invoices", href: "/aa/invoices", icon: Receipt, summary: "Generate monthly invoices, upload the signed PDF and track payment." },
        { title: "Bank details", href: "/aa/bank-details", icon: Banknote, summary: "Account the awarding body pays your invoices into." },
      ],
    },
    {
      title: "Account",
      items: [{ title: "Profile", href: "/aa/profile", icon: Settings, summary: "Agency details and documents." }],
    },
  ],
  sna: [
    {
      items: [
        { title: "Dashboard", href: "/sna", icon: LayoutDashboard, summary: "Pending centre and batch approvals for your state and scheme." },
      ],
    },
    {
      title: "Approvals",
      items: [
        { title: "Centres", href: "/sna/centres", icon: School, summary: "Approve training centres for your scheme." },
        { title: "Batch approvals", href: "/sna/batch-approvals", icon: ListChecks, summary: "Approve submitted government batches." },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { title: "Batches", href: "/sna/batches", icon: Layers, summary: "All active batches of your scheme with candidates and trainers." },
        { title: "Results", href: "/sna/results", icon: ChartColumn, summary: "Marks and results of completed batches." },
      ],
    },
  ],
  toa: [
    {
      items: [{ title: "Dashboard", href: "/toa", icon: LayoutDashboard, summary: "Your RailTel ToA account and programme activity." }],
    },
    {
      title: "Programme",
      items: [
        { title: "Assessors", href: "/toa/assessors", icon: Users, summary: "Register assessors and send them to CUTM for verification." },
        { title: "Batches", href: "/toa/batches", icon: Layers, summary: "Form batches, record attendance and see results." },
        { title: "Payments", href: "/toa/payments", icon: Wallet, summary: "Invoices, online payment and receipts." },
      ],
    },
    {
      title: "Account",
      items: [
        { title: "Notifications", href: "/toa/notifications", icon: Bell, summary: "Decisions and updates from CUTM." },
        { title: "Profile", href: "/toa/profile", icon: Settings, summary: "Organisation details and password." },
      ],
    },
  ],
  "toa-assessor": [
    {
      items: [
        { title: "My programme", href: "/toa-assessor", icon: Award, summary: "Batch, attendance, result and certificate." },
        { title: "Profile", href: "/toa-assessor/profile", icon: Settings, summary: "Your details and password." },
      ],
    },
  ],
  lcrc: [
    {
      items: [{ title: "Dashboard", href: "/lcrc", icon: LayoutDashboard, summary: "Corporate approvals waiting for you." }],
    },
    {
      title: "Approvals",
      items: [
        { title: "Centres", href: "/lcrc/centres", icon: School, summary: "Approve training centres for corporate schemes." },
        { title: "Batches", href: "/lcrc/batches", icon: ListChecks, summary: "Approve submitted corporate batches." },
        { title: "Results", href: "/lcrc/results", icon: Award, summary: "Review results, approve them and publish certificates." },
      ],
    },
    {
      title: "Account",
      items: [{ title: "Profile", href: "/lcrc/profile", icon: Settings, summary: "Your account and password." }],
    },
  ],
};

export const findNavItem = (portal: PortalSlug, href: string): NavItem | undefined =>
  NAVIGATION[portal].flatMap((section) => section.items).find((item) => item.href === href);
