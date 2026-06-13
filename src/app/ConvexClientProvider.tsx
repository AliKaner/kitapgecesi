"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Falls back to a placeholder so the client can still be constructed during
// build-time prerendering when NEXT_PUBLIC_CONVEX_URL isn't set.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
