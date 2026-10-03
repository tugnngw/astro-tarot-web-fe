import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reader")({
  beforeLoad: () => {
    throw redirect({ to: "/staff" });
  },
  component: () => null,
});
