import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { AuthSplit } from "@/components/auth/auth-split";
import { LoginForm } from "@/components/auth/login-form";
import { PORTAL_INFO } from "@/components/auth/portal-info";
import { ROLE_CONFIG, isPortalSlug } from "@/lib/auth/roles";

export function generateStaticParams() {
  return Object.keys(ROLE_CONFIG).map((role) => ({ role }));
}

export async function generateMetadata({ params }: PageProps<"/login/[role]">): Promise<Metadata> {
  const { role } = await params;
  return {
    title: isPortalSlug(role) ? `${ROLE_CONFIG[role].label} login` : "Login",
  };
}

export default async function LoginPage({ params }: PageProps<"/login/[role]">) {
  const { role } = await params;
  if (!isPortalSlug(role)) notFound();
  const config = ROLE_CONFIG[role];
  const info = PORTAL_INFO[role];
  const others = Object.values(ROLE_CONFIG).filter((item) => item.slug !== role);

  return (
    <AuthSplit
      eyebrow="Portal login"
      title={`${config.label} portal`}
      subtitle={`${config.description}.`}
      mobileAction={
        <Link href="/login" className="hover:text-black">
          Switch portal
        </Link>
      }
      panel={
        <div className="flex h-full flex-col justify-between gap-8">
          <ul className="flex flex-col gap-3">
            {info.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[15px] text-black/75">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-black" strokeWidth={1.75} />
                {feature}
              </li>
            ))}
          </ul>
          <div>
            <p className="text-[13px] text-black/50">Other portals</p>
            <div className="mt-3 flex flex-col gap-1">
              {others.map((item) => {
                const Icon = PORTAL_INFO[item.slug].icon;
                return (
                  <Link
                    key={item.slug}
                    href={`/login/${item.slug}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] text-black/75 transition-colors hover:bg-black/[0.05] hover:text-black"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[#e4fa5c] text-black">
            <info.icon className="size-6" />
          </span>
          <h2 className="mt-6 font-display text-[32px] leading-tight font-medium tracking-[-0.045em]">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to the {config.label} portal.</p>
          <div className="mt-8">
            {/* useSearchParams (for ?next=) must sit inside Suspense */}
            <Suspense>
              <LoginForm portal={role} />
            </Suspense>
          </div>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          You are signed out automatically when your session expires.
        </p>
      </div>
    </AuthSplit>
  );
}
