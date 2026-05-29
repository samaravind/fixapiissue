import { HexclaveClientApp } from "@hexclave/next";

let stackClientApp: HexclaveClientApp<true> | null = null;

export function getStackClientApp() {
  if (stackClientApp) {
    return stackClientApp;
  }

  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID?.trim();
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY?.trim();

  if (!projectId) {
    return null;
  }

  try {
    stackClientApp = new HexclaveClientApp({
      projectId,
      ...(publishableClientKey ? { publishableClientKey } : {}),
      tokenStore: "nextjs-cookie",
      urls: {
        default: {
          type: "hosted",
        },
        signIn: "/login",
        signUp: "/login",
      },
    });
  } catch {
    stackClientApp = null;
  }

  return stackClientApp;
}
