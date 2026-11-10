import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CircleCheck, ClipboardCheck } from "lucide-react";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = { title: "Register" };

const OPTIONS = [
  {
    href: "/register/training-partner",
    icon: Building2,
    title: "Training partner",
    description: "Organisations that train candidates at their centres and enrol them in batches.",
    steps: "5 steps + review",
    ready: ["Organisation PAN", "Registered office address", "Head and project contact details", "Sectors and courses you train in"],
  },
  {
    href: "/register/assessment-agency",
    icon: ClipboardCheck,
    title: "Assessment agency",
    description: "Agencies that assess trained candidates and upload their marks.",
    steps: "6 steps + review",
    ready: ["Company PAN and GSTIN", "NCVET recognition letter (PDF or image)", "Agency logo", "Bank details (optional)"],
  },
];

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-[40px] leading-[1.08] font-medium tracking-[-0.045em] text-balance text-black sm:text-[56px]">Join the CUTM Awarding Body</h1>
            <p className="mt-5 text-[17px] leading-[1.65] text-[#4b4b4b]">
              Choose what you are applying as. Your progress is saved on this device, so you can finish later. State nodal agencies and admins
              receive their accounts from the awarding body.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {OPTIONS.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="group flex flex-col rounded-2xl border border-black/[0.08] bg-white p-7 transition-colors hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:p-9"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-[#f4f4f2] text-black">
                    <option.icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-[14px] text-[#8a8a8a]">{option.steps}</span>
                </div>
                <h2 className="mt-8 font-display text-[28px] leading-tight font-medium tracking-[-0.04em] text-black">{option.title}</h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#4b4b4b]">{option.description}</p>
                <div className="mt-7 flex-1 border-t border-black/[0.08] pt-6">
                  <p className="text-[15px] font-medium text-black">Keep these ready</p>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {option.ready.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[15px] text-[#4b4b4b]">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-black" strokeWidth={1.75} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-black px-5 text-[15px] font-medium text-white transition-transform duration-100 group-active:scale-[0.97]">
                  Start application
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-12 text-center text-[15px] text-[#4b4b4b]">
            Already applied?{" "}
            <Link href="/login" className="font-medium text-black underline decoration-black/25 underline-offset-4 hover:decoration-black">
              Log in to follow your application
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
