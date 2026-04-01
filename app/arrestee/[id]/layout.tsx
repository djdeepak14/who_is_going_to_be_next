import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arrestee Details | Who Is Next",
  description: "View detailed custody record and information about an arrested or detained individual.",
};

export default function ArresteeDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
