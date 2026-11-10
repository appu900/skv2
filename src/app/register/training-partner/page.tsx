import type { Metadata } from "next";
import { TrainingPartnerRegistration } from "@/features/register/training-partner-form";

export const metadata: Metadata = { title: "Training partner registration" };

export default function RegisterPage() {
  return <TrainingPartnerRegistration />;
}
