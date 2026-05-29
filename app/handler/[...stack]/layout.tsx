import { HexclaveProvider } from "@hexclave/next";
import { getStackServerApp } from "../../../stack/server";
import StackAuthShell from "../../stack-auth-shell";

export default function StackHandlerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stackServerApp = getStackServerApp();

  if (!stackServerApp) {
    return children;
  }

  return (
    <HexclaveProvider app={stackServerApp}>
      <StackAuthShell>{children}</StackAuthShell>
    </HexclaveProvider>
  );
}
