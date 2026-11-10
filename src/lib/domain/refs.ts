// Populated references come back as objects, unpopulated ones as id strings.
export function refId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) return String((value as { _id: unknown })._id);
  return undefined;
}
