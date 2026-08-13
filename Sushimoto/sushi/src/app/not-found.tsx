import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-center min-h-[60vh] flex-col gap-6 px-4 text-center">
      <h1 className="font-heading text-8xl font-bold text-primary">404</h1>
      <h2 className="font-heading text-3xl text-secondary">Page Not Found</h2>
      <p className="max-w-md font-body text-gray-100">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-4 font-body text-white transition-colors hover:bg-primary"
      >
        Back to Home
      </Link>
    </div>
  );
}
