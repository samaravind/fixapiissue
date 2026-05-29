import { HexclaveProvider } from "@hexclave/next";
import { getStackServerApp } from "../../stack/server";
import StackAuthShell from "../stack-auth-shell";

function LoginLayoutFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4">
      <div className="max-w-md rounded-[2rem] border border-[#dbe3f0] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-3 text-sm text-slate-500">
          Authentication is not configured. Set up your Stack Auth environment variables to enable login.
        </p>
      </div>
    </main>
  );
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stackServerApp = getStackServerApp();

  if (!stackServerApp) {
    return <LoginLayoutFallback />;
  }

  return (
    <HexclaveProvider app={stackServerApp}>
      <StackAuthShell>{children}</StackAuthShell>
    </HexclaveProvider>
  );
}
