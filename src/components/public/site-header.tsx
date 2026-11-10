import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Public header: logo left, links centred, log in / apply on the right (black and white, editorial).
export const outlineButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black px-5 text-[15px] font-medium text-black transition-[transform,background-color] duration-100 ease-out hover:bg-black/[0.04] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
export const solidButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-[15px] font-medium text-white transition-[transform,background-color] duration-100 ease-out hover:bg-black/85 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const LINKS = [
  { href: "/verify", label: "Verify a certificate" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#portals", label: "Portals" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-5 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <Link href="/" className="flex items-center gap-2 text-black">
          <GraduationCap className="size-7" strokeWidth={1.75} />
          <span className="font-display text-[19px] font-semibold tracking-[-0.03em]">CUTM Awarding Body</span>
        </Link>
        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="font-display text-[17px] font-medium tracking-[-0.01em] text-black/85 hover:text-black">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3">
          <Link href="/login" className={cn(outlineButton, "hidden sm:inline-flex")}>
            Log in
          </Link>
          <Link href="/register" className={solidButton}>
            Apply
          </Link>
        </div>
      </div>
    </header>
  );
}
