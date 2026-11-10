import { Award, Briefcase, Building2, TrainFront, ClipboardCheck, MapPinned, ShieldCheck, type LucideIcon } from "lucide-react";
import type { PortalSlug } from "@/lib/auth/roles";

// Presentation of each portal on the login screens (kept out of lib/auth/roles, which the proxy imports).
export const PORTAL_INFO: Record<PortalSlug, { icon: LucideIcon; features: string[] }> = {
  admin: {
    icon: ShieldCheck,
    features: ["Approve training partners and agencies", "Confirm batch payments", "Assign exams to agencies", "Publish certificates"],
  },
  tp: {
    icon: Building2,
    features: ["Manage centres and trainers", "Create batches and enrol candidates", "Upload payment proof", "Follow results and certificates"],
  },
  aa: {
    icon: ClipboardCheck,
    features: ["See the exams assigned to you", "Assign assessors and schedule dates", "Upload attendance and marks", "Raise monthly invoices"],
  },
  sna: {
    icon: MapPinned,
    features: ["Approve training centres", "Approve government batches", "Monitor batches of your scheme", "Review results"],
  },
  lcrc: {
    icon: Briefcase,
    features: ["Approve corporate centres", "Approve corporate batches", "Review and approve results", "Publish certificates"],
  },
  toa: {
    icon: TrainFront,
    features: ["Register assessors for training", "Form and submit batches", "Record attendance", "Pay fees and download certificates"],
  },
  "toa-assessor": {
    icon: Award,
    features: ["See your training batch and sessions", "Check your attendance", "See your result", "Download your certificate"],
  },
};
