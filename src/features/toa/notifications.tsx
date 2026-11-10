"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ToaNotification } from "@/lib/api/toa";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useItem } from "@/lib/api/use-item";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadingRows } from "@/components/shared/loading-rows";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Portal notifications of a ToA account (training partner: /toa/tp, assessor: /toa/assessor).
export function NotificationList({ base, limit }: { base: "/toa/tp" | "/toa/assessor"; limit?: number }) {
  const { data, isLoading } = useItem<{ items: ToaNotification[]; unread: number }>(`${base}/notifications`);
  const read = useApiMutation((id: string) => api.put(`${base}/notifications/${id}/read`), "Marked as read");
  if (isLoading || !data) return <LoadingRows rows={3} />;
  const items = limit ? data.items.slice(0, limit) : data.items;
  if (!items.length) return <EmptyState icon={Bell} title="No notifications" description="Decisions and updates from CUTM appear here." />;
  return (
    <div className="flex flex-col gap-2">
      {!limit && data.unread > 0 && (
        <Button variant="outline" size="sm" className="self-end" onClick={() => read.mutate("all")}>
          <CheckCheck />
          Mark all read
        </Button>
      )}
      {items.map((item) => (
        <div key={item._id} className={cn("rounded-lg border p-3 text-sm", !item.readAt && "border-primary/30 bg-primary/5")}>
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{item.title}</p>
            <span className="shrink-0 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{item.message}</p>
          <div className="mt-2 flex gap-3 text-xs">
            {item.link && (
              <Link href={item.link} className="text-primary underline-offset-4 hover:underline">
                Open
              </Link>
            )}
            {!item.readAt && (
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => read.mutate(item._id)}>
                Mark as read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToaNotificationsPage({ base = "/toa/tp" }: { base?: "/toa/tp" | "/toa/assessor" }) {
  return (
    <>
      <PageHeader title="Notifications" description="Decisions and updates from CUTM. The same messages are also emailed to you." />
      <Card>
        <CardContent>
          <NotificationList base={base} />
        </CardContent>
      </Card>
    </>
  );
}
