import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import GlobalToastContainer from "@/components/global-toast-container";
import { AppWrapper } from "@/components/app-wrapper";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/images/logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "/favicon.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <AppWrapper>
            {children}
            <GlobalToastContainer />
          </AppWrapper>
        </Providers>
      </body>
    </html>
  );
}
