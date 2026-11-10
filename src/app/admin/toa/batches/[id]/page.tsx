import { Suspense } from "react";
import { ToaAdminBatchDetailPage } from "@/features/admin/toa/batches";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function Detail({ params }: { params: PageProps<"/admin/toa/batches/[id]">["params"] }) {
  const { id } = await params;
  return <ToaAdminBatchDetailPage id={id} />;
}

export default function Page({ params }: PageProps<"/admin/toa/batches/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <Detail params={params} />
    </Suspense>
  );
}
