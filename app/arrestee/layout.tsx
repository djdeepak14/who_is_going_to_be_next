import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arrestees | Who Is Next",
  description: "Browse custody records of arrested and detained individuals.",
};

export default function ArresteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
