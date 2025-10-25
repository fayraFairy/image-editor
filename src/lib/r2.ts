import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getEnv } from "./env";

let s3: S3Client | null = null;

export function getR2() {
  if (s3) return s3;
  const env = getEnv();
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new Error("R2 is not configured");
  }
  s3 = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return s3;
}

export async function putR2Object(key: string, body: Buffer, contentType: string) {
  const env = getEnv();
  const client = getR2();
  await client.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: undefined,
  }));
  return {
    key,
    publicUrl: env.R2_PUBLIC_BASE_URL ? `${env.R2_PUBLIC_BASE_URL}/${key}` : undefined,
  };
}


