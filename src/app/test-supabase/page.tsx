import { notFound } from "next/navigation";

import TestSupabaseClient from "./TestSupabaseClient";

/** Developer-only connection check. Returns 404 in production builds and deployments. */
export default function TestSupabasePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <TestSupabaseClient />;
}
