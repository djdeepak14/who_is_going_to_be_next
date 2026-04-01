import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poll Details | Who Is Next",
  description: "View and participate in a poll about arrests and detentions.",
};

export default function PollDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
