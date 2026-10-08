import { createFileRoute } from "@tanstack/react-router";
import { AdminApp } from "@/components/v6admin/AdminApp";

// /v10CtlPanel: V6 admin panel running in parallel with the Worker's /admin
// (docs/V6_ADMIN_BASELINE.md). Independent of V8/V9 UI code.
export const Route = createFileRoute("/v10CtlPanel")({
  head: () => ({
    meta: [{ title: "V6 控制台" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminApp,
});
