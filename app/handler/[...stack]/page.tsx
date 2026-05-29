import { getStackServerApp } from "../../../stack/server";

export const dynamic = "force-dynamic";

type StackRouteProps = {
  params: Promise<{
    stack?: string[];
  }> | {
    stack?: string[];
  };
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function StackAuthHandler(props: StackRouteProps) {
  const params = await props.params;
  const stackServerApp = getStackServerApp();

  if (!stackServerApp) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12 text-center text-sm text-neutral-600">
        Stack Auth is not configured yet.
      </div>
    );
  }

  const { HexclaveHandler } = await import("@hexclave/next");

  return (
    <div className="min-h-screen w-full">
      <HexclaveHandler fullPage />
    </div>
  );
}
