import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Arrestee Record | Who Is Next",
  description: "Create a new custody record for an arrested or detained individual.",
};

export default function CreateArresteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
