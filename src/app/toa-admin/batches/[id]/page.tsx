import { Suspense } from "react";
import { ToaAdminBatchDetailPage } from "@/features/toa-admin/batches";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function Detail({ params }: { params: PageProps<"/toa-admin/batches/[id]">["params"] }) {
  const { id } = await params;
  return <ToaAdminBatchDetailPage id={id} />;
}

export default function Page({ params }: PageProps<"/toa-admin/batches/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <Detail params={params} />
    </Suspense>
  );
}
