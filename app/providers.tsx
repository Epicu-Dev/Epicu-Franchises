"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { ToastProvider } from "@/contexts/toast-context";
import { UserProvider } from "@/contexts/user-context";
import { LoadingProvider } from "@/contexts/loading-context";
import { getValidAccessToken } from "@/utils/auth";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.fetch !== "function") return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        // Build a Request to unify headers/URL handling
        const request = new Request(input as RequestInfo, init);

        // Only attach token for same-origin requests
        const requestUrl = new URL(request.url, window.location.href);
        const isSameOrigin = requestUrl.origin === window.location.origin;

        if (!isSameOrigin) {
          return originalFetch(request);
        }

        // Respect existing Authorization header if already set
        const headers = new Headers(request.headers);
        if (!headers.has("Authorization")) {
          const token = await getValidAccessToken();

          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
        }

        const finalRequest = new Request(request, { headers });
        return originalFetch(finalRequest);
      } catch {
        // Fallback to original fetch if anything goes wrong
        return originalFetch(input as RequestInfo, init);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <UserProvider>
          <LoadingProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LoadingProvider>
        </UserProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
