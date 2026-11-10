import { Suspense } from "react";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AuthSplit } from "@/components/auth/auth-split";
import { ForgotPasswordForm } from "@/components/auth/password-recovery";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page() {
  return (
    <AuthSplit eyebrow="Account" title="Forgot your password?" subtitle="Enter the email of your account and we will send you a link to choose a new password.">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-xl bg-[#e4fa5c] text-black">
          <KeyRound className="size-6" />
        </span>
        <h2 className="mt-6 font-display text-[28px] leading-tight font-medium tracking-[-0.045em]">Forgot your password?</h2>
        <div className="mt-8">
          {/* useSearchParams (portal, token) must sit inside Suspense */}
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </AuthSplit>
  );
}
