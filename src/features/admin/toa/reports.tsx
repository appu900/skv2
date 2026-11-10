"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Search } from "lucide-react";
import { downloadFile } from "@/lib/api/download";
import type { ToaReportRow } from "@/lib/api/toa";
import type { ToaTrainingPartner } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { Field, SelectField } from "@/components/shared/field";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ANY = "any";

export function ToaReportsPage() {
  const partners = useList<ToaTrainingPartner>("/toa/admin/tps");
  const [query, setQuery] = useState("");
  const rows = useList<ToaReportRow>(`/toa/admin/reports${query}`);

  const apply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) if (value && value !== ANY) params.set(key, String(value));
    setQuery(params.size ? `?${params}` : "");
  };
  const exportAs = (format: "xlsx" | "pdf") => downloadFile(`/toa/admin/reports${query ? `${query}&` : "?"}format=${format}`, `toa-report.${format}`);

  return (
    <>
      <PageHeader
        title="ToA reports"
        description="One row per assessor per batch with attendance, payment, result and certificate. Filter, then export."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportAs("xlsx")}>
              <FileSpreadsheet />
              Excel
            </Button>
            <Button variant="outline" onClick={() => exportAs("pdf")}>
              <FileText />
              PDF
            </Button>
          </div>
        }
      />
      <Card className="mb-6">
        <CardContent>
          <form onSubmit={apply} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Training partner" name="toaTpId" defaultValue={ANY} options={[{ value: ANY, label: "All" }, ...(partners.data ?? []).map((tp) => ({ value: tp._id, label: tp.organizationName }))]} />
            <Field label="Programme contains" name="programme" />
            <Field label="Batch starts from" name="from" type="date" />
            <Field label="Batch starts until" name="to" type="date" />
            <SelectField label="Payment" name="paymentStatus" defaultValue={ANY} options={[{ value: ANY, label: "Any" }, "unpaid", "paid", "refunded", "not invoiced"]} />
            <SelectField label="Result" name="result" defaultValue={ANY} options={[{ value: ANY, label: "Any" }, "Pass", "Fail", "Absent"]} />
            <SelectField label="Certificate" name="certificateStatus" defaultValue={ANY} options={[{ value: ANY, label: "Any" }, "valid", "revoked", "withheld", "not issued"]} />
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Search />
                Apply filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ListCard toolbar={<p className="text-sm text-muted-foreground">{rows.data?.length ?? 0} row(s)</p>}>
        {rows.isLoading ? (
          <LoadingRows />
        ) : !rows.data?.length ? (
          <EmptyState icon={FileSpreadsheet} title="No rows match" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessor</TableHead>
                <TableHead className="hidden md:table-cell">Partner / batch</TableHead>
                <TableHead className="hidden lg:table-cell">Dates</TableHead>
                <TableHead className="text-right">Att. %</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="hidden md:table-cell">Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.data.map((row) => (
                <TableRow key={`${row.batchCode}-${row.registrationId}`}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.registrationId}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p>{row.trainingPartner}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.batchCode} · {row.programmeName}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {row.startDate} – {row.endDate}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.attendance === "" ? "—" : row.attendance}</TableCell>
                  <TableCell className="hidden sm:table-cell">{row.paymentStatus}</TableCell>
                  <TableCell>
                    {row.result || "—"} {row.score !== "" && <span className="text-xs text-muted-foreground">({row.score})</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p>{row.certificateNumber || "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.certificateStatus}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
