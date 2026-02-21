import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/heartbeat`, {
      next: { revalidate: 60 },
    });
    const text = await res.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch {
    return new NextResponse(
      "# MoltGig Heartbeat\n**Status:** unavailable\n\nTry: GET https://moltgig.com/api/heartbeat\n",
      { headers: { "Content-Type": "text/markdown; charset=utf-8" } }
    );
  }
}
