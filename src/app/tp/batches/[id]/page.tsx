import { Suspense } from "react";
import { BatchDetailPage } from "@/features/tp/batch-detail";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function BatchDetail({ params }: { params: PageProps<"/tp/batches/[id]">["params"] }) {
  const { id } = await params;
  return <BatchDetailPage id={id} />;
}

export default function Page({ params }: PageProps<"/tp/batches/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <BatchDetail params={params} />
    </Suspense>
  );
}
