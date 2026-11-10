"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import type { Batch } from "@/lib/api/models";
import { BatchResults } from "@/components/shared/batch-results";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// "Results" button opening the marks and certificates of one batch; data loads when it opens.
export function BatchResultsSheet({ batch }: { batch: Batch }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Award />
          Results
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{batch.ABN_Number}</SheetTitle>
          <SheetDescription>
            {batch.courseName} · {batch.centerName}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-6">
          <BatchResults batchId={open ? batch._id : null} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
