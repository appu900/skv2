"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BaseProps {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function Field({
  label,
  name,
  hint,
  required,
  className,
  ...input
}: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} name={name} required={required} {...input} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextareaField({
  label,
  name,
  hint,
  required,
  className,
  ...input
}: BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea id={id} name={name} required={required} {...input} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  hint,
  required,
  className,
  options,
  placeholder = "Select…",
  defaultValue,
  value,
  onValueChange,
}: BaseProps & {
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Select name={name} required={required} defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const item = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Several native checkboxes under one name; read them with form.getAll(name).
export function CheckboxGroup({
  label,
  name,
  hint,
  required,
  className,
  options,
  defaultValues = [],
  emptyText = "Nothing to choose from",
}: BaseProps & {
  options: readonly (string | { value: string; label: string; description?: string })[];
  defaultValues?: string[];
  emptyText?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="mb-2 text-sm leading-none font-medium">
        {label}
        {required && <span className="text-destructive">*</span>}
      </legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="grid max-h-56 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
          {options.map((option) => {
            const item = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <label key={item.value} className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted">
                <input
                  type="checkbox"
                  name={name}
                  value={item.value}
                  defaultChecked={defaultValues.includes(item.value)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  {item.label}
                  {"description" in item && item.description && (
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}
