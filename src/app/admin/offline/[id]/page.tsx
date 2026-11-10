import { Suspense } from "react";
import { EditOfflinePartnerPage } from "@/features/admin/offline/partner-form";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function Edit({ params }: { params: PageProps<"/admin/offline/[id]">["params"] }) {
  const { id } = await params;
  return <EditOfflinePartnerPage id={id} />;
}

export default function Page({ params }: PageProps<"/admin/offline/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <Edit params={params} />
    </Suspense>
  );
}
