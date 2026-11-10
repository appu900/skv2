import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify certificate" };

export default function VerifyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 bg-white px-5 py-20 sm:py-28">
        <h1 className="text-center font-display text-[40px] leading-[1.08] font-medium tracking-[-0.045em] text-black sm:text-[56px]">Verify a certificate</h1>
        <p className="mx-auto mt-5 max-w-lg text-center text-[17px] leading-[1.65] text-[#4b4b4b]">
          Enter the enrolment number printed on the certificate to check that it was issued by the CUTM Awarding Body.
        </p>
        <div className="mt-12">
          {/* reads ?enrollment= from the URL */}
          <Suspense>
            <VerifyForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
