import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polls | Who Is Next",
  description: "Participate in polls about arrests and detentions.",
};

export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
