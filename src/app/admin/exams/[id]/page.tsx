import { Suspense } from "react";
import { ExamDetailPage } from "@/features/aa/exam-detail";
import { LoadingRows } from "@/components/shared/loading-rows";

// CUTM conducts the assessment itself: the admin works on the same screen an agency used to
async function ExamDetail({ params }: { params: PageProps<"/admin/exams/[id]">["params"] }) {
  const { id } = await params;
  return <ExamDetailPage id={id} admin />;
}

export default function Page({ params }: PageProps<"/admin/exams/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <ExamDetail params={params} />
    </Suspense>
  );
}
