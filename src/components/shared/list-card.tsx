import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ListCard({
  title,
  description,
  actions,
  toolbar,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      {(title || actions) && (
        <CardHeader>
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {actions && <CardAction>{actions}</CardAction>}
        </CardHeader>
      )}
      <CardContent className="gap-4">
        {toolbar && <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{toolbar}</div>}
        {children}
      </CardContent>
    </Card>
  );
}
