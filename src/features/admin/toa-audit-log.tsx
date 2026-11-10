"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import type { AuditLogEntry, ToaTrainingPartner } from "@/lib/api/models";
import { useList } from "@/lib/api/use-list";
import { PageHeader } from "@/components/portal/page-header";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ACTIONS: Record<string, string> = {
  created: "Account created",
  updated: "Details changed",
  login: "Logged in",
  login_failed: "Wrong password",
  login_blocked: "Login refused (account not active)",
  account_locked: "Locked after failed logins",
  unlocked: "Unlocked by admin",
  password_changed: "Password changed",
  password_reset_requested: "Asked for a reset link",
  password_reset: "Password reset by link",
  password_reset_by_admin: "Password reset by admin",
  status_active: "Reactivated",
  status_suspended: "Suspended",
  status_deactivated: "Deactivated",
};

export const actionLabel = (action: string) => ACTIONS[action] ?? action.replaceAll("_", " ");

const WARNING = new Set(["login_failed", "account_locked", "login_blocked", "status_suspended", "status_deactivated"]);

// Changed fields as "field: old → new".
function Changes({ entry }: { entry: AuditLogEntry }) {
  if (!entry.before && !entry.after) return <span className="text-muted-foreground">{entry.note ?? "—"}</span>;
  const keys = Object.keys({ ...(entry.before ?? {}), ...(entry.after ?? {}) }).filter((key) => !["_id", "__v", "createdAt", "updatedAt", "createdBy"].includes(key));
  return (
    <ul className="flex flex-col gap-0.5 text-xs">
      {keys.slice(0, 6).map((key) => (
        <li key={key}>
          <span className="text-muted-foreground">{key}:</span> {entry.before ? `${String(entry.before[key] ?? "—")} → ` : ""}
          {String(entry.after?.[key] ?? "—")}
        </li>
      ))}
    </ul>
  );
}

export function ToaAuditLogPage() {
  const [partner, setPartner] = useState("all");
  const [action, setAction] = useState("all");
  const partners = useList<ToaTrainingPartner>("/toa/admin/tps");
  const params = new URLSearchParams({ limit: "300" });
  if (partner !== "all") params.set("entityId", partner);
  if (action !== "all") params.set("action", action);
  const logs = useList<AuditLogEntry>(`/toa/admin/audit-logs?${params}`);
  const names = new Map((partners.data ?? []).map((tp) => [tp._id, tp.organizationName]));

  return (
    <>
      <PageHeader title="ToA audit log" description="Every login, password change, status change and edit in the RailTel ToA module, newest first." />
      <ListCard
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Select value={partner} onValueChange={setPartner}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All training partners</SelectItem>
                {(partners.data ?? []).map((tp) => (
                  <SelectItem key={tp._id} value={tp._id}>
                    {tp.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.entries(ACTIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {logs.isLoading ? (
          <LoadingRows />
        ) : !logs.data?.length ? (
          <EmptyState icon={ScrollText} title="Nothing logged yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>What</TableHead>
                <TableHead className="hidden md:table-cell">Training partner</TableHead>
                <TableHead className="hidden sm:table-cell">By</TableHead>
                <TableHead className="hidden lg:table-cell">Changes</TableHead>
                <TableHead className="hidden xl:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={WARNING.has(entry.action) ? "warning" : "secondary"}>{actionLabel(entry.action)}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{(entry.entityId && names.get(entry.entityId)) || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{entry.actorRole === "Admin" ? "Admin" : entry.actorRole === "ToaTrainingPartner" ? "Partner" : "—"}</TableCell>
                  <TableCell className="hidden max-w-80 lg:table-cell">
                    <Changes entry={entry} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">{entry.ip ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </>
  );
}
