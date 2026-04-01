import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Arrestee Record | Who Is Next",
  description: "Edit the custody record of an arrested or detained individual.",
};

export default function EditArresteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
