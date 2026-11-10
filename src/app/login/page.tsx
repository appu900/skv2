import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthSplit } from "@/components/auth/auth-split";
import { PORTAL_INFO } from "@/components/auth/portal-info";
import { ROLE_CONFIG } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Portal login" };

export default function LoginChooserPage() {
  return (
    <AuthSplit
      eyebrow="Portal login"
      title="One platform, four portals"
      subtitle="From batch creation to verified certificates: each organisation signs in to its own portal."
      mobileAction={
        <Link href="/register" className="hover:text-black">
          Register
        </Link>
      }
    >
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h2 className="font-display text-[32px] leading-tight font-medium tracking-[-0.045em]">Choose your portal</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick the portal of your organisation to sign in.</p>
        <div className="mt-8 flex flex-col gap-3">
          {Object.values(ROLE_CONFIG).map((config) => {
            const Icon = PORTAL_INFO[config.slug].icon;
            return (
              <Link
                key={config.slug}
                href={`/login/${config.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-black/[0.08] bg-white p-4 transition-colors hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f2] text-black transition-colors group-hover:bg-[#e4fa5c]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{config.label}</span>
                  <span className="block text-sm text-muted-foreground">{config.description}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          New training partner or assessment agency?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Apply here
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
