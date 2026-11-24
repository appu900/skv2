"use client";

import type { ToaAdminAccount } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToaPasswordForm } from "@/features/toa/password-form";

export function ToaAdminProfilePage() {
  const { data } = useItem<ToaAdminAccount>("/toa/admin/me");
  return (
    <>
      <PageHeader title="Profile" description="Your RailTel ToA admin login. Ask the CUTM admin to change your name or email." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <DetailList
                items={[
                  ["Name", data.name],
                  ["Email", data.email],
                  ["Mobile", data.mobile],
                  ["Last login", data.lastLoginAt ? formatDate(data.lastLoginAt) : undefined],
                ]}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <ToaPasswordForm portal="toa-admin" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
