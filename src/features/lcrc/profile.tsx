"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api/client";
import type { LcrcAccount } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ChangePassword() {
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      toast.error("The new passwords do not match");
      return;
    }
    setPending(true);
    try {
      await api.put("/lcrc/me/password", { currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") });
      toast.success("Password changed");
      formElement.reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Replace the password from your welcome email with one only you know.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid max-w-md gap-4">
          <Field label="Current password" name="currentPassword" type="password" required autoComplete="current-password" />
          <Field label="New password" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
          <Field label="Repeat new password" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
          <div>
            <Button type="submit" disabled={pending}>
              <KeyRound />
              Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function LcrcProfilePage() {
  const { data, isLoading } = useItem<LcrcAccount>("/lcrc/me");
  return (
    <>
      <PageHeader title="Profile" description="Your LC/RC account. Contact the admin to change your name, phone or region." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <DetailList
                items={[
                  ["Name", data.name],
                  ["Login email", data.email],
                  ["Phone", data.phone],
                  ["Region", data.region],
                  ["Account created", formatDate(data.createdAt)],
                ]}
              />
            )}
          </CardContent>
        </Card>
        <ChangePassword />
      </div>
    </>
  );
}
