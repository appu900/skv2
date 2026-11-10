import { Suspense } from "react";
import { OfflineBatchDetailPage } from "@/features/admin/offline/batch-detail";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function Detail({ params }: { params: PageProps<"/admin/offline/batches/[id]">["params"] }) {
  const { id } = await params;
  return <OfflineBatchDetailPage id={id} />;
}

export default function Page({ params }: PageProps<"/admin/offline/batches/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <Detail params={params} />
    </Suspense>
  );
}
