import { NextResponse } from "next/server";
import { writeHomepageCache } from "@/lib/homepage-cache";

export async function POST() {
  try {
    const cache = await writeHomepageCache();
    return NextResponse.json({
      ok: true,
      stats: cache.stats,
      updatedAt: cache.updatedAt,
    });
  } catch (err) {
    console.error("Cache rebuild error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to rebuild cache" },
      { status: 500 },
    );
  }
}
