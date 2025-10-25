import { z } from "zod";

const envSchema = z.object({
  REPLICATE_API_TOKEN: z.string().min(1).optional(),
  REPLICATE_INPAINT_MODEL: z.string().default("REPLICATE_OWNER/reve-edit"),
  REPLICATE_INPAINT_VERSION: z.string().optional(),
  REPLICATE_STYLE_MODEL: z.string().default("REPLICATE_OWNER/nano-banana-style"),
  REPLICATE_STYLE_VERSION: z.string().optional(),
  REPLICATE_ENHANCE_MODEL: z.string().default("REPLICATE_OWNER/nano-banana-enhance"),
  REPLICATE_ENHANCE_VERSION: z.string().optional(),

  // Mock mode configuration
  MOCK_MODE: z.enum(["true", "false"]).default("false"),
  MOCK_PROCESSING_DELAY: z.string().default("3000"), // 3 seconds default delay

  WEBHOOK_SECRET: z.string().min(1),
  PUBLIC_WEB_BASE_URL: z.string().url().default("https://localhost:3000"),

  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}


