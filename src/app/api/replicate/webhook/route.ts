import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { updateJob } from "@/lib/jobs";
import { putR2Object } from "@/lib/r2";

async function verifySignature(req: NextRequest, secret: string) {
  // Minimal placeholder: in production, compute HMAC of body and compare header
  const provided = req.headers.get("x-replicate-signature") || "";
  return Boolean(secret) && Boolean(provided);
}

export async function POST(req: NextRequest) {
  const env = getEnv();
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "jobId missing" } }, { status: 400 });

  // 在 Mock 模式下跳过签名验证
  if (env.MOCK_MODE !== "true") {
    const ok = await verifySignature(req, env.WEBHOOK_SECRET);
    if (!ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "invalid signature" } }, { status: 401 });
  }

  const body = await req.json();
  const status = body.status as string;

  if (status !== "succeeded") {
    updateJob(jobId, { status: status === "failed" ? "failed" : "processing" });
    return NextResponse.json({ ok: true });
  }

  const outputs: string[] = Array.isArray(body.output) ? body.output : [body.output].filter(Boolean);
  if (!outputs.length) {
    updateJob(jobId, { status: "failed", error: "no output" });
    return NextResponse.json({ ok: true });
  }

  // 在 Mock 模式下，直接使用输出 URL
  if (env.MOCK_MODE === "true") {
    updateJob(jobId, { status: "completed", outputUrl: outputs[0], finishedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  }

  // 真实模式：Fetch output and upload to R2 if configured
  try {
    const res = await fetch(outputs[0]);
    const buf = Buffer.from(await res.arrayBuffer());
    const key = `jobs/${jobId}/result.png`;
    const { publicUrl } = await putR2Object(key, buf, res.headers.get("content-type") || "image/png");
    updateJob(jobId, { status: "completed", outputUrl: publicUrl ?? key, finishedAt: new Date().toISOString() });
  } catch (e: unknown) {
    updateJob(jobId, { status: "failed", error: (e as Error)?.message || "upload failed" });
  }

  return NextResponse.json({ ok: true });
}


