import type { Metadata } from "next";
import { AssessmentAgencyRegistration } from "@/features/register/assessment-agency-form";

export const metadata: Metadata = { title: "Assessment agency registration" };

export default function RegisterPage() {
  return <AssessmentAgencyRegistration />;
}
