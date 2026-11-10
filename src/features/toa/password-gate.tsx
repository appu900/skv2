"use client";

import { ShieldAlert } from "lucide-react";
import type { ToaTrainingPartner } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToaPasswordForm } from "./password-form";

// Accounts get a temporary password from CUTM; nothing else of the portal opens until it is replaced.
export function ToaPasswordGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useItem<ToaTrainingPartner>("/toa/tp/me");

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!data.mustChangePassword) return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-lg py-6">
      <Card>
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <ShieldAlert className="size-5" />
          </span>
          <CardTitle>Set your own password</CardTitle>
          <CardDescription>
            Your account was created by CUTM with a temporary password. Choose a new one to continue; the temporary password from the email stops working.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToaPasswordForm submitLabel="Save and continue" />
        </CardContent>
      </Card>
    </div>
  );
}
