"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Dialog with a native form. onSubmit gets the FormData; the dialog closes when it resolves.
export function FormDialog({
  trigger,
  title,
  description,
  submitLabel = "Save",
  onSubmit,
  children,
  wide,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  submitLabel?: string;
  onSubmit: (form: FormData) => Promise<unknown>;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    try {
      await onSubmit(new FormData(event.currentTarget));
      setOpen(false);
    } catch {
      // error toast comes from the mutation
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[90vh] p-0", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 px-6 py-4">{children}</div>
          </ScrollArea>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
