"use client";

import { Megaphone, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Notice } from "@/lib/api/models";
import { useApiMutation } from "@/lib/api/use-api-mutation";
import { useList } from "@/lib/api/use-list";
import { formatDate } from "@/lib/domain/stages";
import { PageHeader } from "@/components/portal/page-header";
import { Field, TextareaField } from "@/components/shared/field";
import { FileLink } from "@/components/shared/file-link";
import { FormDialog } from "@/components/shared/form-dialog";
import { ListCard } from "@/components/shared/list-card";
import { LoadingRows } from "@/components/shared/loading-rows";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function CreateNoticeDialog() {
  // multipart: optional PDF goes up as "pdf"
  const create = useApiMutation((form: FormData) => api.post("/admin/notification", form), "Notification published");
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus />
          New notification
        </Button>
      }
      title="Publish a notification"
      description="Shown on the public site until it expires; it is deleted automatically afterwards."
      submitLabel="Publish"
      onSubmit={(form) => {
        if (!(form.get("pdf") as File | null)?.size) form.delete("pdf");
        return create.mutateAsync(form);
      }}
    >
      <Field label="Title" name="title" required />
      <TextareaField label="Description" name="description" rows={4} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Expires on" name="expiredAt" type="date" required />
        <Field label="PDF (optional)" name="pdf" type="file" accept="application/pdf" />
      </div>
    </FormDialog>
  );
}

export function NotificationsPage() {
  const { data = [], isLoading } = useList<Notice>("/admin/notifications");
  return (
    <>
      <PageHeader title="Notifications" description="Notices published on the public website." actions={<CreateNoticeDialog />} />
      <ListCard>
        {isLoading ? (
          <LoadingRows />
        ) : data.length === 0 ? (
          <EmptyState icon={Megaphone} title="No active notifications" />
        ) : (
          <div className="flex flex-col divide-y">
            {data.map((notice) => (
              <div key={notice._id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{notice.title}</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{notice.description}</p>
                  {notice.pdf && (
                    <div className="mt-2">
                      <FileLink href={notice.pdf} label="Attachment" />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <Badge variant="outline">Published {formatDate(notice.createdAt)}</Badge>
                  <Badge variant="warning">Expires {formatDate(notice.expiredAt)}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </ListCard>
    </>
  );
}
