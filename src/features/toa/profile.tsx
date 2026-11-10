"use client";

import type { ToaTrainingPartner } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToaPasswordForm } from "./password-form";

export function ToaProfilePage() {
  const { data, isLoading } = useItem<ToaTrainingPartner>("/toa/tp/me");
  return (
    <>
      <PageHeader title="Profile" description="Your organisation as registered by CUTM. Contact the CUTM admin to change these details." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <DetailList
                items={[
                  ["Training partner code", data.tpCode],
                  ["Organisation", data.organizationName],
                  ["Contact person", data.contactPerson],
                  ["Login email", data.email],
                  ["Mobile", data.mobile],
                  ["Address", data.address],
                  ["State", data.state],
                  ["GST", data.gstNumber],
                  ["PAN", data.panNumber],
                  ["Password last changed", formatDate(data.passwordChangedAt)],
                ]}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
            <CardDescription>Changing it signs you out on every other device.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToaPasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
