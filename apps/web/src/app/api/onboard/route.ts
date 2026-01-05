// apps/web/src/app/api/onboard/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { onboardRepo } from "@/../../../packages/ai/orchestrator";
export const maxDuration = 60; // Vercel Pro needed, we will burn it

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { url } = body;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    const result = await onboardRepo(url, session?.accessToken);

    return Response.json({
      ok: true,
      ...result,
      message: "You just got onboarded harder than anyone in history.",
    });
  } catch (error: any) {
    console.error("[ONBOARD ERROR]", error);
    return Response.json(
      { error: error.message || "The AI had a stroke. Try again." },
      { status: 500 }
    );
  }
}