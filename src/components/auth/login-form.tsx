"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { ROLE_CONFIG, type PortalSlug } from "@/lib/auth/roles";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchemeSelect } from "./scheme-select";

export function LoginForm({ portal }: { portal: PortalSlug }) {
  const config = ROLE_CONFIG[portal];
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await axios.post("/api/auth/login", {
        portal,
        email: form.get("email"),
        password: form.get("password"),
        scheme: form.get("scheme") || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      const next = searchParams.get("next");
      // only follow redirects that stay inside this portal
      router.replace(next && next.startsWith(`/${portal}`) ? next : `/${portal}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="username" required placeholder="you@organisation.com" className="h-11 pl-9" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 pr-10 pl-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {config.needsScheme && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheme">Scheme</Label>
          <SchemeSelect id="scheme" name="scheme" />
        </div>
      )}
      {config.forgotPassword && (
        <Link href={`/forgot-password?portal=${portal}`} className="-mt-2 self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Forgot password?
        </Link>
      )}
      <Button type="submit" size="lg" disabled={submitting} className="mt-1 h-11">
        {submitting && <Loader2 className="animate-spin" />}
        Sign in
        {!submitting && <ArrowRight />}
      </Button>
      {config.registerPath && (
        <Link
          href={config.registerPath}
          className="group mt-2 flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span>
            <span className="block font-medium">New to the platform?</span>
            <span className="text-muted-foreground">Apply as a {config.label.toLowerCase()}</span>
          </span>
          <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </form>
  );
}
