"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { getStackClientApp } from "../stack/client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

if (convexClient) {
  const stackClientApp = getStackClientApp();
  if (stackClientApp) {
    convexClient.setAuth(stackClientApp.getConvexClientAuth({}));
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convexClient) {
    return children;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
