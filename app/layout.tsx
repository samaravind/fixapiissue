import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import SiteFooter from "./site-footer";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { getStackServerApp } from "../stack/server";

export const metadata: Metadata = {
  title: "Fixx Market | Deals, categories and fast shopping",
  description: "A Flipkart-inspired marketplace storefront built for browsing deals, categories and quick shopping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stackServerApp = getStackServerApp();

  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-[#f1f3f6]">
        {stackServerApp ? (
          <HexclaveProvider app={stackServerApp}>
            <HexclaveTheme>
              <ConvexClientProvider>{children}</ConvexClientProvider>
              <SiteFooter />
            </HexclaveTheme>
          </HexclaveProvider>
        ) : (
          <>
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <SiteFooter />
          </>
        )}
      </body>
    </html>
  );
}
