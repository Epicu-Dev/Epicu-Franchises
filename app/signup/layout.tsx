import { Metadata, Viewport } from "next";

import { Providers } from "../providers";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Initialisation du mot de passe - ${siteConfig.name}`,
  description: "Page d'initialisation du mot de passe Epicu",
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

export default function SignupLayout({
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
