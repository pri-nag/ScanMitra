"use client";

export default function CenterMap({ address }: { address: string }) {
  const query = encodeURIComponent(address);
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Location</h2>
      <iframe
        title="Center location map"
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        className="w-full h-64 rounded-xl border border-border bg-secondary/30"
        loading="lazy"
      />
    </div>
  );
}
