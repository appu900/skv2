"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Mail, XCircle } from "lucide-react";

const CONTACT = "awardingbody@cutm.ac.in";

export function ApplicationStatusCard() {
  const rejected = useSearchParams().get("status") === "Rejected";
  const Icon = rejected ? XCircle : Clock;

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-10">
      <span className={rejected ? "flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600" : "flex size-12 items-center justify-center rounded-xl bg-[#e4fa5c] text-black"}>
        <Icon className="size-6" />
      </span>
      <h2 className="mt-6 font-display text-[28px] leading-tight font-medium tracking-[-0.045em]">
        {rejected ? "Your application was not approved" : "Your application is not approved yet"}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[#4b4b4b]">
        {rejected
          ? "The awarding body did not approve your training partner application, so you cannot sign in. Contact us if you think this is a mistake or want to apply again."
          : "Thank you for applying. The awarding body is reviewing your application. You can sign in to the training partner portal as soon as it is approved; we will email you when that happens."}
      </p>
      <a href={`mailto:${CONTACT}`} className="mt-6 flex items-center gap-2 text-sm font-medium text-black hover:underline">
        <Mail className="size-4" />
        {CONTACT}
      </a>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/" className="inline-flex h-10 items-center rounded-full border border-black/15 px-5 text-sm font-medium hover:border-black">
          Back to home
        </Link>
        <Link href="/login" className="inline-flex h-10 items-center rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/85">
          Sign in to another portal
        </Link>
      </div>
    </div>
  );
}
