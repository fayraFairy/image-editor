import Replicate from "replicate";
import { getEnv } from "./env";
import { createMockPrediction, getMockPrediction } from "./mock";

let client: Replicate | null = null;

export function getReplicate(): Replicate {
  if (client) return client;
  const env = getEnv();
  if (!env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is required when not in mock mode");
  }
  client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  return client;
}

export type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

export interface PredictionCreateArgs {
  model: string;
  input: Record<string, unknown>;
  webhook?: string;
  webhook_secret?: string;
  jobId?: string;
}

export async function createPrediction(args: PredictionCreateArgs) {
  const env = getEnv();
  
  // 检查是否在 Mock 模式
  if (env.MOCK_MODE === "true") {
    return await createMockPrediction({
      model: args.model,
      input: args.input,
      webhook: args.webhook,
      webhook_secret: args.webhook_secret,
      jobId: args.jobId,
    });
  }
  
  // 使用真实的 Replicate API
  const replicate = getReplicate();
  return await replicate.predictions.create({
    model: args.model,
    input: args.input,
    webhook: args.webhook,
    webhook_events_filter: ["start", "completed"],
  });
}


