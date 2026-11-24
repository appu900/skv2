import { redirect } from "next/navigation";

// The SNA no longer approves or monitors batches (client, 2026-11-20); only centres and certificates.
export default function Page() {
  redirect("/sna/results");
}
