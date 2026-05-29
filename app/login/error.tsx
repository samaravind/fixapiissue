"use client";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (!error.message.includes("useStackApp must be used within a StackProvider")) {
    console.error(error);
  }

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
