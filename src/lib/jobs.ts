import { v4 as uuidv4 } from "uuid";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  jobId: string;
  type: "inpaint" | "style" | "enhance";
  status: JobStatus;
  predictionId?: string;
  input: Record<string, unknown>;
  outputUrl?: string;
  previewUrl?: string;
  startedAt?: string;
  finishedAt?: string;
  cost?: { usd: number };
  error?: string;
}

const jobs = new Map<string, Job>();

export function createJob(type: Job["type"], input: Record<string, unknown>): Job {
  const job: Job = {
    jobId: uuidv4(),
    type,
    status: "queued",
    input,
  };
  jobs.set(job.jobId, job);
  return job;
}

export function updateJob(jobId: string, partial: Partial<Job>) {
  const existing = jobs.get(jobId);
  if (!existing) return;
  const updated = { ...existing, ...partial };
  jobs.set(jobId, updated);
}

export function getJob(jobId: string) {
  return jobs.get(jobId);
}

export function listJobs(limit = 20): Job[] {
  return Array.from(jobs.values()).slice(-limit).reverse();
}


