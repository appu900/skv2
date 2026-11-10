import { Suspense } from "react";
import { OfflineBatchesPage } from "@/features/admin/offline/batches";
import { LoadingRows } from "@/components/shared/loading-rows";

// reads ?tp= from the URL, so it renders inside Suspense
export default function Page() {
  return (
    <Suspense fallback={<LoadingRows rows={6} />}>
      <OfflineBatchesPage />
    </Suspense>
  );
}
