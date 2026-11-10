import { Construction } from "lucide-react";
import { findNavItem } from "@/config/navigation";
import type { PortalSlug } from "@/lib/auth/roles";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "./page-header";

// Skeleton page shown until the feature behind a menu entry is built.
export function PlaceholderPage({ portal, href }: { portal: PortalSlug; href: string }) {
  const item = findNavItem(portal, href);
  return (
    <>
      <PageHeader title={item?.title ?? "Page"} description={item?.summary} />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Construction className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">This screen is being built</p>
          <p className="max-w-md text-sm text-muted-foreground">{item?.summary}</p>
        </CardContent>
      </Card>
    </>
  );
}
