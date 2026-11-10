import type { Stage } from "@/lib/domain/stages";
import { Badge } from "@/components/ui/badge";

const VARIANT = {
  default: "secondary",
  muted: "outline",
  success: "success",
  warning: "warning",
  info: "info",
} as const;

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge variant={VARIANT[stage.tone]}>{stage.label}</Badge>;
}
