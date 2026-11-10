"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ListChecks, Loader2, Pencil, RotateCcw, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { BrandPanel } from "@/components/public/brand-panel";
import { Button } from "@/components/ui/button";

export type StepValue = string | File | string[];
export type StepValues = Record<string, StepValue>;

export interface Step {
  title: string;
  description?: string;
  icon: LucideIcon;
  /** Checkbox groups: always stored as arrays, even with zero or one box ticked. */
  multi?: string[];
  /** Extra checks after the browser's own validation; return an error message to stay on the step. */
  validate?: (values: StepValues) => string | null;
  /** Holds files or the password, which are not kept in the saved draft. */
  reenter?: boolean;
  render: (values: StepValues) => React.ReactNode;
}

// ** never written to the device: secrets and files (files cannot be stored anyway)
const NOT_SAVED = ["password", "confirmPassword"];

interface Draft {
  values: StepValues;
  index: number;
  savedAt: number;
}

// Unfinished applications are kept in localStorage so a closed tab does not lose the typing.
const draftStore = {
  key: (id: string) => `register-draft:${id}`,
  read(id: string): string | null {
    try {
      return window.localStorage.getItem(draftStore.key(id));
    } catch {
      return null;
    }
  },
  write(id: string, values: StepValues, index: number) {
    const kept = Object.fromEntries(Object.entries(values).filter(([key, value]) => !NOT_SAVED.includes(key) && !(value instanceof File)));
    try {
      window.localStorage.setItem(draftStore.key(id), JSON.stringify({ values: kept, index, savedAt: Date.now() } satisfies Draft));
    } catch {
      // storage full or blocked: the form still works, only without resume
    }
  },
  clear(id: string) {
    try {
      window.localStorage.removeItem(draftStore.key(id));
    } catch {
      // ignore
    }
  },
};

const subscribeStorage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

function useSavedDraft(id: string): Draft | null {
  const raw = useSyncExternalStore(subscribeStorage, () => draftStore.read(id), () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      const draft = JSON.parse(raw) as Draft;
      return draft.index > 0 ? draft : null;
    } catch {
      return null;
    }
  }, [raw]);
}

// Reads one step's form into values. Empty file inputs keep the file picked earlier (inputs can't be prefilled).
function collect(form: HTMLFormElement, step: Step, previous: StepValues): StepValues {
  const data = new FormData(form);
  const next: StepValues = { ...previous };
  for (const name of step.multi ?? []) next[name] = [];
  for (const [name, value] of data.entries()) {
    if (step.multi?.includes(name)) {
      (next[name] as string[]).push(String(value));
    } else if (value instanceof File) {
      if (value.size > 0) next[name] = value;
    } else {
      next[name] = value.trim();
    }
  }
  return next;
}

export const valueOf = (values: StepValues, name: string) => {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
};

function Stepper({ items, index, onSelect, disabled }: { items: { title: string; icon: LucideIcon; description?: string }[]; index: number; onSelect: (i: number) => void; disabled: boolean }) {
  return (
    <ol className="relative flex flex-col gap-1">
      {items.map((item, i) => {
        const done = i < index;
        const current = i === index;
        return (
          <li key={item.title} className="relative">
            {i < items.length - 1 && (
              <span aria-hidden className={cn("absolute top-11 left-[1.375rem] h-[calc(100%-2.25rem)] w-px", done ? "bg-black/40" : "bg-black/10")} />
            )}
            <button
              type="button"
              disabled={!done || disabled}
              onClick={() => onSelect(i)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors",
                done && "hover:bg-black/[0.04]",
                current && "bg-white shadow-xs"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                  done && "border-black bg-black text-white",
                  current && "border-black bg-[#e4fa5c] text-black",
                  !done && !current && "border-black/15 text-black/40"
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : <item.icon className="size-3.5" />}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className={cn("block text-sm font-medium", current || done ? "text-black" : "text-black/45")}>{item.title}</span>
                {current && item.description && <span className="mt-0.5 block text-xs leading-relaxed text-black/60">{item.description}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// Full screen multi-step application: branded stepper on the left, one step at a time on the right,
// a review with "Edit" links at the end. Progress is kept on the device until the application is sent.
export function StepForm({
  id,
  title,
  subtitle,
  loginHref,
  steps,
  review,
  submitLabel = "Submit application",
  onSubmit,
  done,
}: {
  id: string;
  title: string;
  subtitle: string;
  loginHref: string;
  steps: Step[];
  review: (values: StepValues, edit: (step: number) => void) => React.ReactNode;
  submitLabel?: string;
  onSubmit: (values: StepValues) => Promise<unknown>;
  done: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<StepValues>({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftHandled, setDraftHandled] = useState(false);
  const draft = useSavedDraft(id);

  const items = [...steps.map(({ title, icon, description }) => ({ title, icon, description })), { title: "Review", icon: ListChecks, description: "Check everything and send the application." }];
  const reviewing = index === steps.length;
  const current = items[index];
  const progress = submitted ? 100 : Math.round((index / items.length) * 100);
  const showResume = Boolean(draft) && !draftHandled && index === 0 && !submitted;

  const goTo = (next: number) => {
    setIndex(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const step = steps[index];
    const next = collect(event.currentTarget, step, values);
    const error = step.validate?.(next);
    if (error) {
      toast.error(error);
      return;
    }
    setValues(next);
    setDraftHandled(true);
    draftStore.write(id, next, index + 1);
    goTo(index + 1);
  };

  const handleSubmit = async () => {
    setPending(true);
    try {
      await onSubmit(values);
      draftStore.clear(id);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  const resume = () => {
    if (!draft) return;
    setValues(draft.values);
    setDraftHandled(true);
    // ** files and passwords are not stored, so never jump past the first step that needs them again
    const firstReentry = steps.findIndex((step) => step.reenter);
    goTo(Math.min(draft.index, firstReentry === -1 ? steps.length : firstReentry));
  };

  const startOver = () => {
    draftStore.clear(id);
    setDraftHandled(true);
  };

  return (
    <div className="public-theme flex min-h-svh flex-col lg:flex-row">
      <BrandPanel
        eyebrow="Application"
        title={title}
        subtitle={subtitle}
        mobileAction={
          <Link href={loginHref} className="hover:text-black">
            Sign in
          </Link>
        }
        mobile={
          <>
            <div className="flex items-baseline justify-between text-xs text-black/60">
              <span className="font-medium text-black">{submitted ? "Submitted" : current.title}</span>
              <span>{submitted ? "Done" : `Step ${index + 1} of ${items.length}`}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
            </div>
          </>
        }
      >
        <Stepper items={items} index={submitted ? items.length : index} onSelect={goTo} disabled={pending || submitted} />
      </BrandPanel>

      {/* step */}
      <main className="flex flex-1 flex-col bg-white">
        <div className="hidden items-center justify-end gap-2 px-10 pt-6 text-sm text-muted-foreground lg:flex">
          Already registered?
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:py-10">
          {submitted ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{done}</div>
          ) : (
            <>
              {showResume && draft && (
                <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center animate-in fade-in">
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Continue your application?</p>
                    <p className="text-muted-foreground">
                      Saved on this device on {new Date(draft.savedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. Uploaded files and the password need to be entered again.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={startOver}>
                      <RotateCcw />
                      Start over
                    </Button>
                    <Button size="sm" onClick={resume}>
                      Resume
                    </Button>
                  </div>
                </div>
              )}

              <div key={index} className="flex flex-1 flex-col animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="mb-6 flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e4fa5c] text-black">
                    <current.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Step {index + 1} of {items.length}
                    </p>
                    <h2 className="font-display text-[26px] leading-tight font-medium tracking-[-0.04em] sm:text-[32px]">{reviewing ? "Review and submit" : current.title}</h2>
                    {current.description && <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>}
                  </div>
                </div>

                {reviewing ? (
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-col gap-4">{review(values, goTo)}</div>
                    <ActionBar>
                      <Button type="button" variant="ghost" onClick={() => goTo(index - 1)} disabled={pending}>
                        <ArrowLeft />
                        Back
                      </Button>
                      <Button type="button" size="lg" onClick={handleSubmit} disabled={pending} className="min-w-44">
                        {pending ? <Loader2 className="animate-spin" /> : <Check />}
                        {submitLabel}
                      </Button>
                    </ActionBar>
                  </div>
                ) : (
                  <form onSubmit={handleNext} className="flex flex-1 flex-col">
                    <div className="flex flex-col gap-4">{steps[index].render(values)}</div>
                    <ActionBar>
                      <Button type="button" variant="ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
                        <ArrowLeft />
                        Back
                      </Button>
                      <Button type="submit" size="lg" className="min-w-36">
                        Continue
                        <ArrowRight />
                      </Button>
                    </ActionBar>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4 sm:shadow-sm">
      <div className="flex items-center justify-between gap-3">{children}</div>
    </div>
  );
}

// Card of a form step: a small heading over a grid of fields.
export function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>
    </section>
  );
}

// Review card: label / value pairs (empty ones left out) and a link back to the step.
export function ReviewSection({ title, items, onEdit }: { title: string; items: [string, React.ReactNode][]; onEdit?: () => void }) {
  const shown = items.filter(([, value]) => value !== undefined && value !== null && value !== "");
  return (
    <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="text-primary">
            <Pencil />
            Edit
          </Button>
        )}
      </div>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {shown.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
