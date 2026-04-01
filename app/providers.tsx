// app/providers.tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/app/context/LanguageContext";
import { ToastProvider } from "@/app/components/ToastProvider";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ClerkProvider afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}