"use client";
import { useUser } from "@clerk/nextjs";

export function CanManage({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;
  if (isSignedIn) return <>{children}</>;
  return null;
}
