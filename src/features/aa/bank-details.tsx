"use client";

import { useState } from "react";
import { Banknote, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { PageHeader } from "@/components/portal/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { Field } from "@/components/shared/field";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgency } from "./use-agency";

// ** only the last 4 digits of the account are shown once saved
const maskAccount = (value?: string) => (value ? `•••• •••• ${value.slice(-4)}` : undefined);

export function BankDetailsPage() {
  const { aaId, profile } = useAgency();
  const agency = profile.data;
  const [editing, setEditing] = useState(false);
  const save = useApiMutation((body: Record<string, string>) => api.put(`/aa/bdt/${aaId}`, body), "Bank details saved");
  const showForm = editing || (agency && !agency.AccountNumber);

  return (
    <>
      <PageHeader title="Bank details" description="The account the awarding body pays your invoices into." />
      {!agency ? (
        <LoadingRows rows={4} />
      ) : (
        <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_18rem]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="size-4 text-primary" />
                {showForm ? "Account details" : agency.BankName}
              </CardTitle>
              <CardDescription>{showForm ? "All fields except branch are required." : agency.BranchName}</CardDescription>
              {!showForm && (
                <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil />
                    Change
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {showForm ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const text = (key: string) => String(form.get(key) ?? "").trim();
                    if (text("accountNumber") !== text("confirmAccount")) return;
                    await save.mutateAsync({
                      bankName: text("bankName"),
                      branchName: text("branchName"),
                      accountNumber: text("accountNumber"),
                      IFSC_Code: text("IFSC_Code").toUpperCase(),
                    });
                    setEditing(false);
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Bank name" name="bankName" required defaultValue={agency.BankName} />
                    <Field label="Branch" name="branchName" defaultValue={agency.BranchName} />
                    <Field label="Account number" name="accountNumber" required inputMode="numeric" pattern="[0-9]{6,20}" title="6 to 20 digits" />
                    <Field
                      label="Confirm account number"
                      name="confirmAccount"
                      required
                      inputMode="numeric"
                      onInput={(event) => {
                        const confirm = event.currentTarget;
                        const account = confirm.form?.elements.namedItem("accountNumber") as HTMLInputElement | null;
                        confirm.setCustomValidity(account && confirm.value !== account.value ? "The account numbers do not match" : "");
                      }}
                    />
                    <Field label="IFSC" name="IFSC_Code" required pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" title="IFSC like SBIN0001234" defaultValue={agency.IFSC_Code} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={save.isPending}>
                      {save.isPending && <Loader2 className="animate-spin" />}
                      Save bank details
                    </Button>
                    {editing && (
                      <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <DetailList
                  items={[
                    ["Account number", maskAccount(agency.AccountNumber)],
                    ["IFSC", agency.IFSC_Code],
                    ["Bank", agency.BankName],
                    ["Branch", agency.BranchName],
                    ["Account type", agency.AccountType],
                    ["MICR", agency.MICR_code],
                  ]}
                />
              )}
            </CardContent>
          </Card>
          <Card className="h-fit border-primary/15 bg-primary/[0.03]">
            <CardContent className="flex flex-col gap-2 text-sm">
              <ShieldCheck className="size-5 text-primary" />
              <p className="font-medium">Why we need this</p>
              <p className="text-muted-foreground">Invoices can only be generated once an account is on file. Only your agency and the awarding body can see or change it.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
