"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Loader2, SearchX } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Certificate {
  certificateCode: string;
  studentName: string;
  fatherName: string;
  Enrolment_number: string;
  qualification: string;
  level: string;
  credit: string;
  duration: string;
  grade: string;
  TrainingCenter: string;
  District: string;
  state: string;
  DateOfIssue: string;
}

const FIELDS: [keyof Certificate, string][] = [
  ["certificateCode", "Certificate number"],
  ["studentName", "Candidate"],
  ["fatherName", "Father's name"],
  ["Enrolment_number", "Enrolment number"],
  ["qualification", "Qualification"],
  ["level", "Level"],
  ["credit", "Credit"],
  ["grade", "Grade"],
  ["TrainingCenter", "Training centre"],
  ["District", "District"],
  ["state", "State"],
];

export function VerifyForm() {
  // ** /verify?enrollment=… (from the landing page or a QR code) checks that number right away
  const initial = useSearchParams().get("enrollment")?.trim() ?? "";
  const [enrollmentNumber, setEnrollmentNumber] = useState(initial);
  const verify = useMutation({
    mutationFn: async (value: string) =>
      (await api.post<ApiResponse<Certificate>>("/student/c/a", { enrollmentNumber: value })).data.data,
  });
  const checked = useRef(false);
  const { mutate } = verify;
  useEffect(() => {
    if (initial && !checked.current) {
      checked.current = true;
      mutate(initial);
    }
  }, [initial, mutate]);

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (enrollmentNumber.trim()) verify.mutate(enrollmentNumber.trim());
        }}
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="enrollment">Enrolment number</Label>
          <Input id="enrollment" value={enrollmentNumber} onChange={(event) => setEnrollmentNumber(event.target.value)} placeholder="e.g. MPR123456" className="h-11 rounded-lg border-black/20 text-[15px] focus-visible:border-black focus-visible:ring-black/10" />
        </div>
        <Button type="submit" disabled={verify.isPending} className="h-11 rounded-lg bg-black px-5 text-white hover:bg-black/85">
          {verify.isPending && <Loader2 className="size-4 animate-spin" />}
          Verify
        </Button>
      </form>

      {verify.isError && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <SearchX className="size-5 text-destructive" />
            <p className="text-sm">{getErrorMessage(verify.error)}</p>
          </CardContent>
        </Card>
      )}

      {verify.data && (
        <Card>
          <CardContent className="py-6">
            <p className="mb-4 flex items-center gap-2 font-medium text-success">
              <BadgeCheck className="size-5" />
              Valid certificate
            </p>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {FIELDS.map(([key, label]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium">{verify.data[key] || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
