"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, CircleCheck, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { ROLE_CONFIG, isPortalSlug } from "@/lib/auth/roles";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { PASSWORD_RULE, strongEnough } from "@/features/toa/password-form";

// Only portals with their own recovery flow (currently RailTel ToA) can be used here.
const usePortal = () => {
  const portal = useSearchParams().get("portal") ?? "";
  return isPortalSlug(portal) && ROLE_CONFIG[portal].forgotPassword ? portal : null;
};

// The backend paths of each portal's recovery endpoints.
const RECOVERY_PATH: Record<string, string> = { toa: "/toa/tp", "toa-assessor": "/toa/assessor" };

function BackToLogin({ portal }: { portal: string }) {
  return (
    <Link href={`/login/${portal}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      Back to login
    </Link>
  );
}

export function ForgotPasswordForm() {
  const portal = usePortal();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  if (!portal) return <p className="text-sm text-muted-foreground">This portal has no password recovery. Please contact the CUTM admin.</p>;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    try {
      await axios.post(`/api/backend${RECOVERY_PATH[portal]}/forgot-password`, { email: new FormData(event.currentTarget).get("email") });
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <MailCheck className="size-8" />
        <p className="text-sm text-muted-foreground">If this email belongs to an active account, a reset link is on its way. It works once and expires in 30 minutes.</p>
        <BackToLogin portal={portal} />
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Login email" name="email" type="email" required autoComplete="username" />
      <Button type="submit" size="lg" disabled={pending} className="h-11">
        {pending && <Loader2 className="animate-spin" />}
        Send reset link
      </Button>
      <BackToLogin portal={portal} />
    </form>
  );
}

export function ResetPasswordForm() {
  const portal = usePortal();
  const token = useSearchParams().get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  if (!portal || !token) return <p className="text-sm text-muted-foreground">This reset link is incomplete. Ask for a new one from the login page.</p>;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword"));
    if (!strongEnough(newPassword)) return toast.error(`Password: ${PASSWORD_RULE}`);
    if (newPassword !== form.get("confirmPassword")) return toast.error("The passwords do not match");
    setPending(true);
    try {
      await axios.post(`/api/backend${RECOVERY_PATH[portal]}/reset-password`, { token, newPassword });
      setDone(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <CircleCheck className="size-8" />
        <p className="text-sm text-muted-foreground">Your password is changed and every older session is signed out.</p>
        <Button asChild size="lg" className="h-11">
          <Link href={`/login/${portal}`}>Log in</Link>
        </Button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="New password" name="newPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" hint={PASSWORD_RULE} />
      <Field label="Repeat new password" name="confirmPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
      <Button type="submit" size="lg" disabled={pending} className="h-11">
        {pending && <Loader2 className="animate-spin" />}
        Set new password
      </Button>
      <BackToLogin portal={portal} />
    </form>
  );
}
