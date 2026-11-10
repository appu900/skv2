"use client";

import { useId, useMemo, useState } from "react";
import { Check, Eye, EyeOff, FileText, UploadCloud, X } from "lucide-react";
import type { Course, Sector } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { StepValues } from "./step-form";

// HTML patterns + the message the browser shows when one does not match.
export const PATTERNS = {
  mobile: { pattern: "[6-9][0-9]{9}", title: "10 digit mobile number", inputMode: "numeric" as const, maxLength: 10 },
  pin: { pattern: "[0-9]{6}", title: "6 digit PIN code", inputMode: "numeric" as const, maxLength: 6 },
  pan: { pattern: "[A-Za-z]{5}[0-9]{4}[A-Za-z]", title: "PAN like ABCDE1234F", maxLength: 10 },
  gst: { pattern: "[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9A-Za-z][Zz][0-9A-Za-z]", title: "15 character GSTIN like 21ABCDE1234F1Z5", maxLength: 15 },
  aadhaar: { pattern: "[0-9]{12}", title: "12 digit Aadhaar number", inputMode: "numeric" as const, maxLength: 12 },
  ifsc: { pattern: "[A-Za-z]{4}0[A-Za-z0-9]{6}", title: "IFSC like SBIN0001234", maxLength: 11 },
};

export const MIN_PASSWORD = 8;

// ---------------------------------------------------------------- password

const STRENGTH = [
  { label: "", color: "bg-muted" },
  { label: "Weak", color: "bg-destructive" },
  { label: "Fair", color: "bg-warning" },
  { label: "Good", color: "bg-chart-2" },
  { label: "Strong", color: "bg-success" },
];

function SecretInput({
  label,
  name,
  defaultValue,
  onValue,
  ...props
}: { label: string; name: string; defaultValue?: string; onValue: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          defaultValue={defaultValue}
          onChange={(event) => onValue(event.target.value)}
          className="pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function PasswordFields({ values }: { values: StepValues }) {
  const [password, setPassword] = useState(typeof values.password === "string" ? values.password : "");
  const [confirm, setConfirm] = useState(typeof values.confirmPassword === "string" ? values.confirmPassword : "");
  const rules = [
    [password.length >= MIN_PASSWORD, `At least ${MIN_PASSWORD} characters`],
    [/[a-z]/.test(password) && /[A-Z]/.test(password), "Upper and lower case letters"],
    [/[0-9]/.test(password), "A number"],
    [/[^A-Za-z0-9]/.test(password), "A symbol"],
  ] as const;
  const score = password ? rules.filter(([ok]) => ok).length : 0;
  const matches = confirm !== "" && confirm === password;

  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SecretInput label="Password" name="password" minLength={MIN_PASSWORD} autoComplete="new-password" defaultValue={password} onValue={setPassword} />
        <SecretInput label="Confirm password" name="confirmPassword" autoComplete="new-password" defaultValue={confirm} onValue={setConfirm} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((bar) => (
            <span key={bar} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", bar <= score ? STRENGTH[score].color : "bg-muted")} />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className="font-medium">{STRENGTH[score].label || "—"}</span>
        </div>
      </div>
      <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
        {[...rules, [matches, "Passwords match"] as const].map(([ok, text]) => (
          <li key={text} className={cn("flex items-center gap-1.5 transition-colors", ok ? "text-success" : "text-muted-foreground")}>
            <Check className={cn("size-3.5", !ok && "opacity-30")} strokeWidth={3} />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const validatePassword = (values: StepValues) =>
  values.password !== values.confirmPassword ? "The passwords do not match" : null;

// ---------------------------------------------------------------- choice chips

// Native checkboxes styled as toggle chips; read them with form.getAll(name).
export function ChoiceChips({
  name,
  options,
  defaultValues = [],
  emptyText = "Nothing to choose from",
  className,
}: {
  name: string;
  options: readonly (string | { value: string; label: string; hint?: string })[];
  defaultValues?: string[];
  emptyText?: string;
  className?: string;
}) {
  if (options.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const item = typeof option === "string" ? { value: option, label: option } : option;
        return (
          <label
            key={item.value}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm transition-all select-none hover:border-primary/40 has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/50"
          >
            <input type="checkbox" name={name} value={item.value} defaultChecked={defaultValues.includes(item.value)} className="peer sr-only" />
            <Check className="hidden size-3.5 peer-checked:block" strokeWidth={3} />
            <span>{item.label}</span>
            {"hint" in item && item.hint && <span className="text-xs opacity-60">{item.hint}</span>}
          </label>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- sectors & courses

// Sector cards; the courses of the ticked sectors appear below as chips, grouped per sector.
export function SectorCoursePicker({ values, sectorName, courseName }: { values: StepValues; sectorName: string; courseName: string }) {
  const sectors = useList<Sector>("/sector/all");
  const courses = useList<Course>("/course/course");
  const [ticked, setTicked] = useState<string[]>((values[sectorName] as string[] | undefined) ?? []);
  const [chosen, setChosen] = useState<string[]>((values[courseName] as string[] | undefined) ?? []);
  const coursesOf = (sector: string) => (courses.data ?? []).filter((course) => course.sectorName === sector);

  return (
    <div
      className="flex flex-col gap-4"
      onChange={(event) => {
        const input = event.target as HTMLInputElement;
        const toggle = (current: string[]) => (input.checked ? [...current, input.value] : current.filter((value) => value !== input.value));
        if (input.name === sectorName) setTicked(toggle);
        if (input.name === courseName) setChosen(toggle);
      }}
    >
      <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Sectors<span className="text-destructive">*</span>
          </h3>
          <span className="text-xs text-muted-foreground">{ticked.length} selected</span>
        </div>
        {sectors.isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : !sectors.data?.length ? (
          <p className="text-sm text-muted-foreground">No sectors are available yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {sectors.data.map((sector) => (
              <label
                key={sector._id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-3 transition-all hover:border-primary/40 has-checked:border-primary has-checked:bg-primary/5 has-checked:ring-1 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring/50"
              >
                <input type="checkbox" name={sectorName} value={sector.name} defaultChecked={ticked.includes(sector.name)} className="peer sr-only" />
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md border text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{sector.name}</span>
                  <span className="block text-xs text-muted-foreground">{coursesOf(sector.name).length} {coursesOf(sector.name).length === 1 ? "course" : "courses"}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Courses</h3>
          <span className="text-xs text-muted-foreground">{chosen.length} selected</span>
        </div>
        {ticked.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Select a sector above to see its courses.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {ticked.map((sector) => (
              <div key={sector} className="flex flex-col gap-2 animate-in fade-in">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{sector}</p>
                <ChoiceChips
                  name={courseName}
                  defaultValues={chosen}
                  emptyText="No courses in this sector yet"
                  options={coursesOf(sector).map((course) => ({ value: course.courseName, label: course.courseName, hint: course.courseCode }))}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export const hasSector = (sectorName: string) => (values: StepValues) =>
  ((values[sectorName] as string[] | undefined) ?? []).length === 0 ? "Pick at least one sector" : null;

// ---------------------------------------------------------------- file drop

const formatSize = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Drag & drop (or click) file picker with a preview. Optional again once a file was picked on an earlier visit.
export function FileDrop({ label, name, values, accept, hint }: { label: string; name: string; values: StepValues; accept: string; hint?: string }) {
  const id = useId();
  const remembered = values[name] instanceof File ? (values[name] as File) : null;
  const [file, setFile] = useState<File | null>(remembered);
  const [dragging, setDragging] = useState(false);
  const [broken, setBroken] = useState<File | null>(null);
  const preview = useMemo(() => (file?.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  const input = () => document.getElementById(id) as HTMLInputElement;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {!remembered && <span className="text-destructive">*</span>}
      </Label>
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          input().files = event.dataTransfer.files;
          setFile(event.dataTransfer.files[0] ?? remembered);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed bg-background p-4 transition-colors hover:border-primary/50 hover:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring/50",
          dragging && "border-primary bg-primary/5",
          file && "border-solid border-primary/30 bg-primary/5"
        )}
      >
        <input id={id} name={name} type="file" accept={accept} required={!remembered} className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? remembered)} />
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
          {preview && broken !== file ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of a local file
            <img src={preview} alt="" className="size-full object-cover" onError={() => setBroken(file)} />
          ) : file ? (
            <FileText className="size-5" />
          ) : (
            <UploadCloud className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="block truncate text-sm font-medium">{file.name}</span>
              <span className="block text-xs text-muted-foreground">{formatSize(file.size)} · click to replace</span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium">
                <span className="text-primary">Click to upload</span> or drag and drop
              </span>
              {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
            </>
          )}
        </span>
        {file && file !== remembered && (
          <button
            type="button"
            aria-label="Remove file"
            onClick={(event) => {
              event.preventDefault();
              input().value = "";
              setFile(remembered);
            }}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
    </div>
  );
}

export const list = (value: unknown) => (Array.isArray(value) && value.length ? value.join(", ") : undefined);
export const fileName = (value: unknown) => (value instanceof File ? value.name : undefined);
