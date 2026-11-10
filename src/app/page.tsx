import Link from "next/link";
import { ArrowRight, BadgeCheck, GraduationCap, Mail } from "lucide-react";
import { PORTAL_INFO } from "@/components/auth/portal-info";
import { SUPPORT_EMAIL } from "@/components/public/brand-panel";
import { SiteHeader, outlineButton, solidButton } from "@/components/public/site-header";
import { ROLE_CONFIG } from "@/lib/auth/roles";

const STEPS = [
  { title: "Train", who: "Training partner", text: "Candidates are enrolled in a batch at an approved training centre." },
  { title: "Approve", who: "State nodal agency", text: "For government schemes, the state approves the centre and then the batch." },
  { title: "Assess", who: "Assessment agency", text: "Every candidate is examined in theory, practical and viva, and the marks are uploaded." },
  { title: "Certify", who: "Awarding body", text: "Candidates who pass receive a certificate with a number anyone can verify." },
];

const display = "font-display font-medium tracking-[-0.045em] text-balance text-black";
const body = "text-[17px] leading-[1.65] text-[#4b4b4b]";

// A sample certificate shown like a site preview (illustration, not a real record).
function CertificateShowcase() {
  return (
    <div className="rounded-3xl bg-[#f4f4f2] p-4 sm:p-10 md:p-16">
      <div className="mx-auto aspect-[1.414/1] max-w-3xl rounded-xl bg-white p-[5%] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_60px_-24px_rgba(0,0,0,0.25)]">
        <div className="flex h-full flex-col rounded-lg border border-black/10 p-[5%]">
          <div className="flex items-start justify-between">
            <span className="flex items-center gap-1.5 text-black">
              <GraduationCap className="size-[clamp(1rem,2.4vw,1.6rem)]" strokeWidth={1.75} />
              <span className="font-display text-[clamp(0.7rem,1.6vw,1rem)] font-semibold tracking-[-0.03em]">CUTM Awarding Body</span>
            </span>
            <span className="rounded-full border border-dashed border-black/25 px-2 py-0.5 text-[clamp(0.55rem,1.1vw,0.75rem)] text-[#6b6b6b]">Sample</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-[clamp(0.6rem,1.3vw,0.9rem)] text-[#6b6b6b]">Certificate of competency</p>
            <p className={`mt-[2%] text-[clamp(1.3rem,4.4vw,3rem)] leading-none ${display}`}>Priya Nayak</p>
            <p className="mt-[3%] max-w-[80%] text-[clamp(0.6rem,1.4vw,0.95rem)] leading-relaxed text-[#4b4b4b]">
              has passed the assessment for <span className="font-medium text-black">Two Wheeler Service Technician</span>, NSQF level 4, with grade A.
            </p>
          </div>
          <div className="flex items-end justify-between text-[clamp(0.55rem,1.15vw,0.8rem)]">
            <div>
              <p className="text-[#8a8a8a]">Certificate number</p>
              <p className="font-medium text-black tabular-nums">CAB2026000184</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e4fa5c] px-[1.8%] py-[0.8%] font-medium text-black">
              <BadgeCheck className="size-[1.2em]" />
              Verifiable online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      {/* announcement */}
      <Link href="/verify" className="block bg-[#e4fa5c] px-4 py-3 text-center text-[15px] leading-snug text-black hover:bg-[#dcf34f]">
        Employers can now check any certificate online with its enrolment number. <span className="font-semibold whitespace-nowrap">Verify a certificate →</span>
      </Link>
      <SiteHeader />

      <main className="flex-1">
        {/* hero */}
        <section className="mx-auto max-w-4xl px-5 pt-20 pb-16 text-center sm:pt-28">
          <h1 className={`text-[44px] leading-[1.06] sm:text-[64px] lg:text-[76px] ${display}`}>Skill certificates people can trust</h1>
          <p className="mt-8 text-[17px] text-black">
            Issued by <span className="font-semibold">CUTM Awarding Body</span> <span className="text-[#8a8a8a]">for state, central and corporate skill schemes</span>
          </p>
          <p className={`mx-auto mt-5 max-w-[40rem] ${body}`}>
            Training partners enrol candidates, state agencies approve their batches, assessment agencies examine every candidate, and those who pass
            receive a certificate anyone can verify. One platform runs the whole journey.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={solidButton}>
              Apply as a partner
            </Link>
            <Link href="/verify" className={outlineButton}>
              Verify a certificate
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:pb-32">
          <CertificateShowcase />
        </section>

        {/* how it works: a real sequence */}
        <section id="how-it-works" className="scroll-mt-24 border-t border-black/[0.08]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
            <h2 className={`mx-auto max-w-2xl text-center text-[36px] leading-[1.1] sm:text-[52px] ${display}`}>From classroom to certificate</h2>
            <p className={`mx-auto mt-5 max-w-xl text-center ${body}`}>Every batch follows the same four steps, and everyone involved can see where it stands.</p>
            <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-black/[0.08] bg-black/[0.08] sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="bg-white p-8">
                  <span className={`text-[44px] leading-none text-black/25 ${display}`}>{index + 1}</span>
                  <h3 className={`mt-8 text-[26px] leading-tight ${display}`}>{step.title}</h3>
                  <p className="mt-1 text-[15px] font-medium text-black">{step.who}</p>
                  <p className="mt-3 text-[15px] leading-[1.6] text-[#4b4b4b]">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* portals */}
        <section id="portals" className="scroll-mt-24 border-t border-black/[0.08] bg-[#fafaf8]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
            <h2 className={`mx-auto max-w-2xl text-center text-[36px] leading-[1.1] sm:text-[52px] ${display}`}>A portal for every organisation</h2>
            <p className={`mx-auto mt-5 max-w-xl text-center ${body}`}>Each organisation signs in to its own portal and only sees its own batches, candidates and results.</p>
            <div className="mt-16 grid gap-4 sm:grid-cols-2">
              {Object.values(ROLE_CONFIG).map((config) => {
                const Icon = PORTAL_INFO[config.slug].icon;
                return (
                  <Link
                    key={config.slug}
                    href={`/login/${config.slug}`}
                    className="group flex items-start gap-5 rounded-2xl border border-black/[0.08] bg-white p-7 transition-colors hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f2] text-black">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[22px] leading-tight ${display}`}>{config.label}</span>
                      <span className="mt-1.5 block text-[15px] leading-[1.6] text-[#4b4b4b]">{config.description}.</span>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-black underline decoration-black/25 underline-offset-4 group-hover:decoration-black">
                        Log in
                        <ArrowRight className="size-4" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* apply */}
        <section className="px-5 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#e4fa5c] px-6 py-16 text-center sm:px-12 sm:py-24">
            <h2 className={`mx-auto max-w-3xl text-[36px] leading-[1.08] sm:text-[56px] ${display}`}>Train or assess with the awarding body</h2>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-[1.65] text-black/75">
              Training partners and assessment agencies apply online. Applications are reviewed by the awarding body, and your progress is saved as you
              go.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register/training-partner" className={solidButton}>
                Apply as a training partner
              </Link>
              <Link href="/register/assessment-agency" className={`${outlineButton} bg-transparent`}>
                Apply as an assessment agency
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-[15px] text-[#4b4b4b] sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span className="flex items-center gap-2 text-black">
            <GraduationCap className="size-6" strokeWidth={1.75} />
            <span className="font-display text-[17px] font-semibold tracking-[-0.03em]">CUTM Awarding Body</span>
          </span>
          <nav className="flex flex-wrap gap-x-7 gap-y-2" aria-label="Footer">
            <Link href="/verify" className="hover:text-black">
              Verify a certificate
            </Link>
            <Link href="/register" className="hover:text-black">
              Apply
            </Link>
            <Link href="/login" className="hover:text-black">
              Log in
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-1.5 hover:text-black">
              <Mail className="size-4" />
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
