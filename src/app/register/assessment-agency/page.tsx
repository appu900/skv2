import { redirect } from "next/navigation";

// No assessment agency in AMASY (client, 2026-11-24): CUTM assesses every batch itself.
export default function Page() {
  redirect("/register");
}
