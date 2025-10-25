import { getEnv } from "./env";
import { createJob, updateJob, getJob } from "./jobs";

export interface MockPrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  input: Record<string, unknown>;
  output?: string[];
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface MockPredictionCreateArgs {
  model: string;
  input: Record<string, unknown>;
  webhook?: string;
  webhook_secret?: string;
  jobId?: string;
}

// 模拟图像处理功能
async function processImageMock(
  type: "enhance" | "inpaint" | "style",
  input: Record<string, unknown>
): Promise<string> {
  // 在服务器端直接返回模拟结果，不进行实际处理
  console.log(`Mock processing ${type} with input:`, input);
  
  // 返回一个1x1像素的透明PNG
  const mockImageUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  return mockImageUrl;
}

// 创建模拟的预测
export async function createMockPrediction(args: MockPredictionCreateArgs): Promise<MockPrediction> {
  const env = getEnv();
  const delay = parseInt(env.MOCK_PROCESSING_DELAY) || 3000;
  
  // 如果没有传入jobId，创建一个新的job
  let jobId = args.jobId;
  if (!jobId) {
    // 从model名称推断job类型
    const jobType = args.model.includes("enhance") ? "enhance" : 
                   args.model.includes("inpaint") ? "inpaint" : "style";
    const job = createJob(jobType, args.input);
    jobId = job.jobId;
  } else {
    // 如果传入了jobId，确保job存在，如果不存在则创建一个
    const existingJob = getJob(jobId);
    if (!existingJob) {
      console.warn(`Job ${jobId} not found, creating new job`);
      const jobType = args.model.includes("enhance") ? "enhance" : 
                     args.model.includes("inpaint") ? "inpaint" : "style";
      const newJob = createJob(jobType, args.input);
      jobId = newJob.jobId; // 使用新创建的job的ID
    }
  }
  
  const prediction: MockPrediction = {
    id: jobId, // 使用jobId作为prediction ID
    status: "starting",
    input: args.input,
    created_at: new Date().toISOString(),
  };

  // 模拟异步处理
  setTimeout(async () => {
    try {
      // 更新状态为处理中
      prediction.status = "processing";
      prediction.started_at = new Date().toISOString();
      
      // 更新job状态
      updateJob(jobId, { status: "processing", startedAt: new Date().toISOString() });
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 执行本地图像处理
      const result = await processImageMock(
        args.model.includes("enhance") ? "enhance" : 
        args.model.includes("inpaint") ? "inpaint" : "style",
        args.input
      );
      
      // 更新状态为完成
      prediction.status = "succeeded";
      prediction.output = [result];
      prediction.completed_at = new Date().toISOString();
      
      // 更新job状态为完成
      updateJob(jobId, { 
        status: "completed", 
        outputUrl: result, 
        finishedAt: new Date().toISOString() 
      });
      
      // 如果有 webhook，调用它
      if (args.webhook) {
        await callWebhook(args.webhook, prediction, args.webhook_secret);
      }
    } catch (error) {
      prediction.status = "failed";
      prediction.error = error instanceof Error ? error.message : "Unknown error";
      prediction.completed_at = new Date().toISOString();
      
      // 更新job状态为失败
      updateJob(jobId, { 
        status: "failed", 
        error: prediction.error,
        finishedAt: new Date().toISOString() 
      });
      
      if (args.webhook) {
        await callWebhook(args.webhook, prediction, args.webhook_secret);
      }
    }
  }, 100); // 短暂延迟后开始处理

  return prediction;
}

// 调用 webhook
async function callWebhook(webhookUrl: string, prediction: MockPrediction, secret?: string) {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret && { "Authorization": `Bearer ${secret}` }),
      },
      body: JSON.stringify({
        id: prediction.id,
        status: prediction.status,
        input: prediction.input,
        output: prediction.output,
        error: prediction.error,
        created_at: prediction.created_at,
        started_at: prediction.started_at,
        completed_at: prediction.completed_at,
      }),
    });
    
    if (!response.ok) {
      console.error(`Webhook call failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Webhook call error:", error);
  }
}

// 获取模拟预测状态
export function getMockPrediction(id: string): MockPrediction | null {
  // 在实际实现中，这里应该从内存或数据库中获取
  // 为了简化，我们返回一个模拟的完成状态
  return {
    id,
    status: "succeeded",
    input: {},
    output: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="],
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
}
