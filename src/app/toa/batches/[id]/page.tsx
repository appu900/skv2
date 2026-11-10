import { Suspense } from "react";
import { ToaBatchDetailPage } from "@/features/toa/batch-detail";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function Detail({ params }: { params: PageProps<"/toa/batches/[id]">["params"] }) {
  const { id } = await params;
  return <ToaBatchDetailPage id={id} />;
}

export default function Page({ params }: PageProps<"/toa/batches/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <Detail params={params} />
    </Suspense>
  );
}
