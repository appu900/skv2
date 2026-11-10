import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {actions.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Icon className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
