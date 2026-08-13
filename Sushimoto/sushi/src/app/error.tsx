"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-center min-h-[60vh] flex-col gap-6 px-4 text-center">
      <h1 className="font-heading text-6xl font-bold text-primary">Oops!</h1>
      <h2 className="font-heading text-2xl text-secondary">Something went wrong</h2>
      <p className="max-w-md font-body text-gray-100">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-4 font-body text-white transition-colors hover:bg-primary"
      >
        Try Again
      </button>
    </div>
  );
}
