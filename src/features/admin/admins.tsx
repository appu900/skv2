"use client";

import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { PageHeader } from "@/components/portal/page-header";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminsPage() {
  const create = useApiMutation(
    (body: { name: string; email: string; password: string }) => api.post("/admin", body),
    "Admin account created"
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await create.mutateAsync({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    formElement.reset();
  };

  return (
    <>
      <PageHeader title="Admins" description="Give another person full access to the admin portal." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            New admin account
          </CardTitle>
          <CardDescription>Admins can approve organisations, confirm payments and publish certificates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Full name" name="name" required minLength={4} maxLength={150} />
            <Field label="Email" name="email" type="email" required autoComplete="off" />
            <Field label="Password" name="password" type="password" required minLength={6} maxLength={32} autoComplete="new-password" hint="6 to 32 characters." />
            <Button type="submit" disabled={create.isPending} className="self-start">
              Create admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
