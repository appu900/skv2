"use client";

import { Award, Download } from "lucide-react";
import { downloadFile } from "@/lib/api/download";
import type { Certificate, Mark } from "@/lib/api/models";
import { useItem } from "@/lib/api/use-item";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Marks and issued certificates of one batch. Pass a null id to skip loading (e.g. while a sheet is closed).
export function BatchResults({ batchId }: { batchId: string | null }) {
  const results = useItem<{ marks: Mark[] }>(batchId ? `/marks/batch/${batchId}` : null);
  const certificates = useList<Certificate>(batchId ? `/certificate/batch/${batchId}` : null);

  return (
    <Tabs defaultValue="results">
      <TabsList>
        <TabsTrigger value="results">Results</TabsTrigger>
        <TabsTrigger value="certificates">
          Certificates <Badge variant="secondary">{certificates.data?.length ?? 0}</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="results" className="mt-4">
        {results.isLoading ? (
          <LoadingRows />
        ) : !results.data?.marks?.length ? (
          <EmptyState icon={Award} title="No marks uploaded yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.data.marks.map((mark) => (
                <TableRow key={mark._id}>
                  <TableCell>
                    <p className="font-medium">{mark.studentName}</p>
                    <p className="text-xs text-muted-foreground">{mark.MPR_ID}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{mark.total}</TableCell>
                  <TableCell className="text-right">{mark.Grade}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={mark.Result === "Pass" ? "success" : "destructive"}>{mark.Result}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
      <TabsContent value="certificates" className="mt-4">
        {certificates.isLoading ? (
          <LoadingRows />
        ) : !certificates.data?.length ? (
          <EmptyState icon={Award} title="No certificates issued yet" />
        ) : (
          <div className="flex flex-col gap-3">
          <Button variant="outline" size="sm" className="self-end" onClick={() => downloadFile(`/certificate/batch/${batchId}/pdf`, "certificates.pdf")}>
            <Download />
            All certificates (PDF)
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Issued</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.data.map((certificate) => (
                <TableRow key={certificate._id}>
                  <TableCell className="font-mono text-xs">{certificate.certificateCode}</TableCell>
                  <TableCell>
                    <p className="font-medium">{certificate.studentName}</p>
                    <p className="text-xs text-muted-foreground">{certificate.Enrolment_number}</p>
                  </TableCell>
                  <TableCell className="text-right">{certificate.grade}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    {formatDate(certificate.DateOfIssue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => downloadFile(`/certificate/${certificate._id}/pdf`, `${certificate.Enrolment_number}-certificate.pdf`)}>
                      <Download />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
