import { Suspense } from "react";
import { ExamDetailPage } from "@/features/aa/exam-detail";
import { LoadingRows } from "@/components/shared/loading-rows";

// params are request data under cacheComponents, so they are read inside Suspense
async function ExamDetail({ params }: { params: PageProps<"/aa/exams/[id]">["params"] }) {
  const { id } = await params;
  return <ExamDetailPage id={id} />;
}

export default function Page({ params }: PageProps<"/aa/exams/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <ExamDetail params={params} />
    </Suspense>
  );
}
