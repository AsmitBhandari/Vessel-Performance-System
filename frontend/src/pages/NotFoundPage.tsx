import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("404");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Decorative icon */}
      <div className="size-20 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-10 text-muted-foreground"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </div>

      {/* 404 */}
      <h1 className="text-7xl font-black tracking-tighter text-foreground/20 mb-2">
        404
      </h1>
      <h2 className="text-xl font-bold tracking-tight mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
        Check the URL or navigate back to the platform.
      </p>

      {/* Return Home */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[hsl(210,70%,50%)] text-white text-sm font-semibold hover:bg-[hsl(210,70%,45%)] transition-colors shadow-lg shadow-[hsl(210,70%,50%)]/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Return Home
      </Link>
    </div>
  );
}
