"use client";
import { useUser } from "@clerk/nextjs";

export function CanManage({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  // Frontend only checks authentication; backend enforces authorization.
  if (isSignedIn) return <>{children}</>;
  return null;
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  // Kept for compatibility with existing usage sites.
  if (isSignedIn) return <>{children}</>;
  return null;
}