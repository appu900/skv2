import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { ToaVerification } from "@/components/public/toa-verify";

export const metadata: Metadata = { title: "Verify RailTel ToA certificate" };

async function Result({ params }: { params: PageProps<"/verify/toa/[code]">["params"] }) {
  const { code } = await params;
  return <ToaVerification code={code} />;
}

export default function Page({ params }: PageProps<"/verify/toa/[code]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 bg-white px-5 py-16 sm:py-24">
        <p className="text-[13px] text-black/50">RailTel Training of Assessors</p>
        <h1 className="mt-1 font-display text-[36px] leading-[1.08] font-medium tracking-[-0.045em] text-black sm:text-[48px]">Certificate verification</h1>
        <div className="mt-10">
          <Suspense>
            <Result params={params} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
