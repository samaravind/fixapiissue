import "server-only";
import { HexclaveServerApp } from "@hexclave/next";
import { getStackClientApp } from "./client";

let stackServerApp: HexclaveServerApp | null = null;

export function getStackServerApp() {
  if (stackServerApp) {
    return stackServerApp;
  }

  const clientApp = getStackClientApp();
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY?.trim();

  if (!clientApp || !secretServerKey) {
    return null;
  }

  try {
    stackServerApp = new HexclaveServerApp({
      inheritsFrom: clientApp,
    });
  } catch {
    stackServerApp = null;
  }

  return stackServerApp;
}
