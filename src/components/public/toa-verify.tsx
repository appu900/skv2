"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CircleAlert, Loader2 } from "lucide-react";
import axios from "axios";

interface Verification {
  certificateNumber: string;
  status: "valid" | "revoked" | "reissued";
  statusReason?: string | null;
  replacedBy?: string | null;
  name: string;
  registrationId: string;
  programmeName: string;
  batchCode: string;
  trainingPartner?: string;
  startDate: string;
  endDate: string;
  result: string;
  issueDate: string;
}

const day = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

// What the QR code on a RailTel ToA certificate opens.
export function ToaVerification({ code }: { code: string }) {
  const [state, setState] = useState<{ data?: Verification; error?: string }>({});
  useEffect(() => {
    axios
      .get(`/api/backend/toa/public/verify/${encodeURIComponent(code)}`)
      .then((response) => setState({ data: response.data.data }))
      .catch((error) => setState({ error: error.response?.data?.message ?? "Could not check this certificate" }));
  }, [code]);

  if (!state.data && !state.error) {
    return (
      <p className="flex items-center gap-2 text-[15px] text-black/60">
        <Loader2 className="size-4 animate-spin" />
        Checking…
      </p>
    );
  }
  if (state.error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-black/10 p-6">
        <CircleAlert className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">No matching certificate</p>
          <p className="mt-1 text-[15px] text-black/60">{state.error}</p>
        </div>
      </div>
    );
  }
  const cert = state.data!;
  const valid = cert.status === "valid";
  return (
    <div className="rounded-2xl border border-black/10 p-6 sm:p-8">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${valid ? "bg-[#e4fa5c] text-black" : "bg-black text-white"}`}>
        {valid ? <BadgeCheck className="size-4" /> : <CircleAlert className="size-4" />}
        {valid ? "Valid certificate" : cert.status === "revoked" ? "Revoked" : "Replaced by a corrected certificate"}
      </span>
      {!valid && (
        <p className="mt-3 text-[15px] text-black/70">
          {cert.statusReason}
          {cert.replacedBy ? ` The current certificate is ${cert.replacedBy}.` : ""}
        </p>
      )}
      <h2 className="mt-6 font-display text-[32px] leading-tight font-medium tracking-[-0.04em]">{cert.name}</h2>
      <dl className="mt-6 grid gap-x-8 gap-y-4 text-[15px] sm:grid-cols-2">
        {[
          ["Certificate number", cert.certificateNumber],
          ["Registration ID", cert.registrationId],
          ["Programme", cert.programmeName],
          ["Result", cert.result],
          ["Training partner", cert.trainingPartner],
          ["Batch", `${cert.batchCode} · ${day(cert.startDate)} – ${day(cert.endDate)}`],
          ["Issued on", day(cert.issueDate)],
          ["Issued by", "CUTM Awarding Body · RailTel Training of Assessors"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[13px] text-black/50">{label}</dt>
            <dd className="mt-0.5 text-black">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
