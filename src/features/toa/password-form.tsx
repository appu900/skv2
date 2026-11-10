"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";

export const PASSWORD_RULE = "8–64 characters with at least one letter and one number.";
export const strongEnough = (value: string) => value.length >= 8 && value.length <= 64 && /[A-Za-z]/.test(value) && /\d/.test(value);

// Goes through /api/auth/toa-password: the backend ends the old session, so the cookie gets the new token there.
export function ToaPasswordForm({ submitLabel = "Change password", onDone, portal = "toa" }: { submitLabel?: string; onDone?: () => void; portal?: "toa" | "toa-assessor" }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newPassword = String(form.get("newPassword"));
    if (!strongEnough(newPassword)) return toast.error(`New password: ${PASSWORD_RULE}`);
    if (newPassword !== form.get("confirmPassword")) return toast.error("The new passwords do not match");
    setPending(true);
    try {
      await axios.put("/api/auth/toa-password", { portal, currentPassword: form.get("currentPassword"), newPassword });
      toast.success("Password changed");
      formElement.reset();
      await queryClient.invalidateQueries();
      onDone?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Current password" name="currentPassword" type="password" required autoComplete="current-password" />
      <Field label="New password" name="newPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" hint={PASSWORD_RULE} />
      <Field label="Repeat new password" name="confirmPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
