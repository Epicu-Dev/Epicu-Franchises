import { Metadata, Viewport } from "next";

import { Providers } from "../providers";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Connexion - ${siteConfig.name}`,
  description: "Page de connexion Epicu",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
      {children}
    </Providers>
  );
} 