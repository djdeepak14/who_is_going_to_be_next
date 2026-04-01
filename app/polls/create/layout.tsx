import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Poll | Who Is Next",
  description: "Create a new poll about arrests and detentions.",
};

export default function CreatePollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
