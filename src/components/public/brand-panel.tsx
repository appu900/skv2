import Link from "next/link";
import { GraduationCap, Mail } from "lucide-react";

export const SUPPORT_EMAIL = "awardingbody@cutm.ac.in";

// Grey brand column of the split auth / registration screens. `children` fill the desktop column,
// `mobile` is the slim strip shown under the logo on small screens, `mobileAction` sits next to the logo.
export function BrandPanel({
  eyebrow,
  title,
  subtitle,
  children,
  mobile,
  mobileAction,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  mobile?: React.ReactNode;
  mobileAction?: React.ReactNode;
}) {
  return (
    <aside className="relative overflow-hidden border-b border-black/[0.06] bg-[#f4f4f2] text-black lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-[22rem] lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 xl:w-96">
      <div className="relative flex items-center justify-between gap-4 px-5 py-4 lg:px-8 lg:pt-8">
        <Link href="/" className="flex items-center gap-2 text-black">
          <GraduationCap className="size-6" strokeWidth={1.75} />
          <span className="font-display text-[17px] font-semibold tracking-[-0.03em]">CUTM Awarding Body</span>
        </Link>
        {mobileAction && <div className="text-[13px] font-medium text-black/70 lg:hidden">{mobileAction}</div>}
      </div>

      <div className="relative hidden flex-1 flex-col px-8 pt-8 pb-8 lg:flex">
        <p className="text-[13px] text-black/50">{eyebrow}</p>
        <h1 className="mt-1 font-display text-[30px] leading-[1.1] font-medium tracking-[-0.04em] text-balance">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-black/65">{subtitle}</p>
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
        <div className="mt-6 rounded-xl border border-black/[0.08] bg-white p-4 text-[13px] leading-relaxed text-black/65">
          <p className="font-medium text-black">Need help?</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-flex items-center gap-1.5 hover:text-black">
            <Mail className="size-3.5" />
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      {mobile && <div className="relative px-5 pb-4 lg:hidden">{mobile}</div>}
    </aside>
  );
}
