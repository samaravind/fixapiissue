"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { SignIn, SignUp, useUser } from "@hexclave/next";
import { useRouter } from "next/navigation";
import { LoginErrorBoundary } from "../login-error-boundary";

function LoginContent() {
  const router = useRouter();
  const user = useUser();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden overflow-hidden rounded-[2.25rem] border border-[#dbe3f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6 md:p-8 lg:block">
          <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#f8fbff] via-white to-[#eef4ff] p-4 sm:min-h-[520px] sm:p-8">
            <div className="absolute inset-0 rounded-[2rem] opacity-40" />
            <div className="relative w-full max-w-[720px] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
              <Image
                src="/login-illustration.png"
                alt="Login illustration"
                width={1200}
                height={1200}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#dbe3f0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">
            {mode === "login" ? "Login" : "Sign Up"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>

          <div className="mt-6 grid grid-cols-2 rounded-full bg-[#eef3ff] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-[#2f6fe4] text-white shadow-[0_8px_20px_rgba(47,111,228,0.28)]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-[#2f6fe4] text-white shadow-[0_8px_20px_rgba(47,111,228,0.28)]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-8">
            {mode === "login" ? <SignIn /> : <SignUp />}
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginFallback() {
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

export default function LoginPage() {
  return (
    <LoginErrorBoundary fallback={<LoginFallback />}>
      <Suspense
        fallback={
          <main className="min-h-screen flex items-center justify-center bg-[#f4f6fb]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </main>
        }
      >
        <LoginContent />
      </Suspense>
    </LoginErrorBoundary>
  );
}
