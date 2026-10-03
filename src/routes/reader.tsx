import { createFileRoute, redirect } from "@tanstack/react-router";

// READER đã gộp vào STAFF — legacy /reader redirect sang workspace STAFF.
export const Route = createFileRoute("/reader")({
  beforeLoad: () => {
    throw redirect({ to: "/staff" });
  },
  component: () => null,
});
