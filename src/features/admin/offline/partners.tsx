"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Pencil, Plus } from "lucide-react";
import type { OfflineTp } from "@/lib/api/offline";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { SearchInput, matches } from "@/components/shared/search-input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function OfflinePartnersPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useList<OfflineTp>("/offline/admin/tps");
  const rows = data.filter((tp) => matches(search, tp.organizationName, tp.tpCode, tp.projectContactPersonName ?? "", tp.registeredOfficeState ?? "", tp.scheme ?? ""));
  return (
    <>
      <PageHeader
        title="Offline training partners"
        description="Partners that send their details to CUTM instead of using the platform. CUTM acts as their assessment agency and issues their attendance sheets, result sheets and certificates."
        actions={
          <Button asChild>
            <Link href="/admin/offline/new">
              <Plus />
              Add offline partner
            </Link>
          </Button>
        }
      />
      <ListCard toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search name, code, state…" />}>
        {isLoading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={Building} title="No offline partners yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="text-right">Batches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tp) => (
                <TableRow key={tp._id}>
                  <TableCell>
                    <p className="font-medium">{tp.organizationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {tp.tpCode}
                      {tp.scheme ? ` · ${tp.scheme}` : ""}
                      {tp.registeredOfficeState ? ` · ${tp.registeredOfficeState}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tp.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p>{tp.projectContactPersonName ?? tp.headOwnerName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{[tp.projectContactPersonMobile ?? tp.registeredOfficeMobile, tp.projectContactPersonEmail ?? tp.registeredOfficeEmail].filter(Boolean).join(" · ")}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tp.batches ?? 0}
                    <span className="text-xs text-muted-foreground"> ({tp.publishedBatches ?? 0} published)</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tp.status === "active" ? "success" : "outline"}>{tp.status === "active" ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/offline/${tp._id}`}>
                        <Pencil />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/offline/batches?tp=${tp._id}`}>Batches</Link>
                    </Button>
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
