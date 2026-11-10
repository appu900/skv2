"use client";

import { BadgeCheck, Building2, FileText, Globe, Layers, Mail, MapPin, Phone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/domain/stages";
import { FileLink } from "@/components/shared/file-link";
import { LoadingRows } from "@/components/shared/loading-rows";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency } from "./use-agency";

function InfoItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{children || <span className="text-muted-foreground">—</span>}</dd>
      </div>
    </div>
  );
}

export function AgencyProfilePage() {
  const { profile } = useAgency();
  const agency = profile.data;

  if (!agency) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-44 w-full rounded-xl" />
        <LoadingRows rows={6} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="h-28 bg-linear-to-r from-primary to-chart-2/80 dark:from-primary/45 dark:to-chart-2/20" />
        <div className="flex flex-col gap-4 px-6 pb-6">
          <Avatar className="-mt-10 size-20 rounded-2xl border-4 border-card bg-card shadow-md">
            {agency.logo && <AvatarImage src={agency.logo} alt="" className="rounded-2xl object-contain p-1" />}
            <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">{agency.agencyName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{agency.agencyName}</h1>
              <ApplicationStatusBadge status={agency.applicationStatus} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[agency.legalStatusOfTheOrganization, agency.headOfTheOrganization && `Head: ${agency.headOfTheOrganization}`, agency.createdAt && `Joined ${formatDate(agency.createdAt)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Payment share", agency.paymentPercentage !== undefined ? `${agency.paymentPercentage}%` : "Not set"],
              ["Certified assessors", agency.total_no_of_certified_Assessor ?? "—"],
              ["Branches", agency.NO_OF_BRANCHES ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-primary" />
                Agency details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <InfoItem icon={FileText} label="PAN">{agency.COMPANY_PAN_NO}</InfoItem>
                <InfoItem icon={FileText} label="GSTIN">{agency.COMPANY_GST_NO}</InfoItem>
                <InfoItem icon={Mail} label="Email">{agency.email}</InfoItem>
                <InfoItem icon={Phone} label="Phone">{agency.phoneNumber}</InfoItem>
                <InfoItem icon={Globe} label="Website">
                  {agency.websiteLink && (
                    <a href={agency.websiteLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {agency.websiteLink.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </InfoItem>
                <InfoItem icon={MapPin} label="Region">{[agency.geographical_region, agency.state_Under_geographicalRegion].filter(Boolean).join(" · ")}</InfoItem>
                <div className="sm:col-span-2">
                  <InfoItem icon={MapPin} label="Office address">{agency.officeAddress}</InfoItem>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" />
                Single point of contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-3">
                <InfoItem icon={Users} label="Name">{agency.SPOC_NAME}</InfoItem>
                <InfoItem icon={Phone} label="Mobile">{agency.SPOC_CONTACT_NO}</InfoItem>
                <InfoItem icon={Mail} label="Email">{agency.SPOC_EMAIL}</InfoItem>
              </dl>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BadgeCheck className="size-4 text-primary" />
                Documents
              </CardTitle>
              <CardDescription>Submitted with your application</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <FileLink href={agency.LETTER_OF_NCVET} label="NCVET letter" />
              <FileLink href={agency.logo} label="Logo" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-primary" />
                Sectors & courses
              </CardTitle>
              <CardDescription>What you can assess</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {(agency.sectors ?? []).map((sector) => (
                  <Badge key={sector} variant="secondary" className="capitalize">
                    {sector}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(agency.courses ?? []).map((course) => (
                  <Badge key={course} variant="outline" className="font-normal">
                    {course}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
