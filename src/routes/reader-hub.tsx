import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reader-hub")({
  beforeLoad: () => {
    throw redirect({ to: "/staff" });
  },
  component: () => null,
});
