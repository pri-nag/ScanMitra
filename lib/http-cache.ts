import { NextResponse } from "next/server";

export function jsonNoStore(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    },
  });
}

export function jsonPublicCache(data: unknown, maxAgeSeconds: number, swrSeconds = 0, status = 200) {
  const swrPart = swrSeconds > 0 ? `, stale-while-revalidate=${swrSeconds}` : "";
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": `public, max-age=${maxAgeSeconds}${swrPart}`,
    },
  });
}
