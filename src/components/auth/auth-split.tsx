import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandPanel, SUPPORT_EMAIL } from "@/components/public/brand-panel";

// Split screen used by the login pages: brand panel on the left, content centred on the right.
export function AuthSplit({
  eyebrow,
  title,
  subtitle,
  panel,
  mobileAction,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  panel?: React.ReactNode;
  mobileAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="public-theme flex min-h-svh flex-col lg:flex-row">
      <BrandPanel eyebrow={eyebrow} title={title} subtitle={subtitle} mobileAction={mobileAction}>
        {panel}
      </BrandPanel>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white">
        <div className="relative hidden justify-end px-10 pt-6 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">{children}</div>

        <footer className="relative flex flex-col items-center justify-between gap-2 border-t border-black/[0.08] px-6 py-4 text-[13px] text-black/55 sm:flex-row lg:px-10">
          <span>© CUTM Awarding Body</span>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link href="/verify" className="hover:text-foreground">
              Verify a certificate
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">
              Help
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
