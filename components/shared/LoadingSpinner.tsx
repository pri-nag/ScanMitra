"use client";

export default function LoadingSpinner({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} border-2 border-primary/30 border-t-primary rounded-full animate-spin`}
      aria-label="Loading"
    />
  );
}
