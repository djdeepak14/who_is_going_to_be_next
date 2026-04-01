import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Who Is Next",
  description: "Sign in to access custody records and polls about arrests and detentions.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
