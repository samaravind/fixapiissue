import { HexclaveServerApp } from "@hexclave/next";

let adminStackServerApp: HexclaveServerApp | null = null;

export function getAdminStackServerApp() {
  if (adminStackServerApp) {
    return adminStackServerApp;
  }

  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID?.trim();
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY?.trim();
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY?.trim();

  if (!projectId || !publishableClientKey || !secretServerKey) {
    return null;
  }

  adminStackServerApp = new HexclaveServerApp({
    projectId,
    publishableClientKey,
    secretServerKey,
    tokenStore: "nextjs-cookie",
    urls: {
      home: "/admin/users",
      afterSignIn: "/admin/users",
    },
  });

  return adminStackServerApp;
}
