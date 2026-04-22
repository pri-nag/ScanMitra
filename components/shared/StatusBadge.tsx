const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  IN_QUEUE: "bg-cyan-500/15 text-cyan-400",
  IN_PROGRESS: "bg-purple-500/15 text-purple-400",
  DONE: "bg-green-500/15 text-green-400",
  NO_SHOW: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium rounded-md px-2 py-1 ${STATUS_CLASSES[status] || "bg-secondary text-foreground"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
