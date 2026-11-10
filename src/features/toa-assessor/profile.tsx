"use client";

import type { ToaTrainee } from "@/lib/api/toa";
import { useItem } from "@/lib/api/use-item";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToaPasswordForm } from "@/features/toa/password-form";
import { tpName } from "@/features/toa/labels";

export function AssessorProfilePage() {
  const { data } = useItem<ToaTrainee>("/toa/assessor/me");
  return (
    <>
      <PageHeader title="Profile" description="Your registration as submitted by your training partner and verified by CUTM. Ask your training partner to request corrections." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <DetailList
                items={[
                  ["Registration ID", data.registrationId],
                  ["Name", data.name],
                  ["Email", data.email],
                  ["Mobile", data.mobile],
                  ["Date of birth", formatDate(data.dob)],
                  ["Qualification", data.qualification],
                  ["Experience", data.experienceYears !== undefined ? `${data.experienceYears} years` : undefined],
                  ["Training partner", tpName(data.toaTpId)],
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
            <ToaPasswordForm portal="toa-assessor" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
