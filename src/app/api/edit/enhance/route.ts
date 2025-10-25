import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { createJob, updateJob } from "@/lib/jobs";
import { createPrediction } from "@/lib/replicate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, options = {}, returnPreview = true } = body ?? {};
    if (!image) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "image is required" } }, { status: 400 });
    }
    const env = getEnv();
    const job = createJob("enhance", { options });
    const webhook = `${env.PUBLIC_WEB_BASE_URL}/api/replicate/webhook?jobId=${job.jobId}`;
    const model = env.REPLICATE_ENHANCE_MODEL;
    const input: Record<string, unknown> = { image, ...options };

    const prediction = await createPrediction({ model, input, webhook, webhook_secret: env.WEBHOOK_SECRET, jobId: job.jobId });
    updateJob(job.jobId, { predictionId: prediction.id, status: "processing", startedAt: new Date().toISOString() });

    return NextResponse.json({ jobId: job.jobId, status: "queued", predictionId: prediction.id, previewUrl: returnPreview ? null : undefined }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message: (err as Error)?.message ?? "unknown" } }, { status: 500 });
  }
}


