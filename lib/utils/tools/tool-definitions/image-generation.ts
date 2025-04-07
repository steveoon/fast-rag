import { tool } from 'ai';
import { z } from 'zod';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';
import { CREATE_TASK_URL, GET_TASK_URL, MAX_POLLING_ATTEMPTS, POLLING_INTERVAL } from 'constant';

// 图像生成函数接口
interface GenerateImageOptions {
  prompt: string;
  style?: 'cartoon' | 'realistic' | 'illustration';
  size?: string;
  n?: number;
  negativePrompt?: string;
  abortSignal?: AbortSignal;
}

// 图像生成结果接口
interface ImageResult {
  url: string;
  base64?: string;
  uint8Array?: Uint8Array;
  prompt: string;
  actualPrompt?: string;
}

// 通义万象API响应接口
interface BailianTaskResponse {
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUSPENDED' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
    message?: string;
    submit_time?: string;
    scheduled_time?: string;
    end_time?: string;
    results?: BailianImageResult[];
    task_metrics?: {
      TOTAL: number;
      SUCCEEDED: number;
      FAILED: number;
    };
    code?: string;
  };
  request_id: string;
  usage?: {
    image_count: number;
  };
}

// 通义万象图像结果接口
interface BailianImageResult {
  url?: string;
  orig_prompt?: string;
  actual_prompt?: string;
  code?: string;
  message?: string;
}

/**
 * 使用通义万象 API 生成图像
 */
export async function generateImageWithBailian({
  prompt,
  style = 'cartoon',
  size = '1024*1024',
  n = 1,
  negativePrompt,
  abortSignal,
}: GenerateImageOptions): Promise<{ images: ImageResult[] }> {
  // 获取API密钥
  const apiKey = process.env.BAILIAN_ALI_API_KEY;
  if (!apiKey) {
    throw new Error('未配置通义万象API密钥 (BAILIAN_ALI_API_KEY)');
  }

  try {
    // 1. 创建图像生成任务
    console.log('正在创建通义万象图像生成任务...');
    const taskId = await createImageTask({
      prompt,
      style,
      size,
      n,
      negativePrompt,
      apiKey,
      abortSignal,
    });

    // 2. 轮询获取任务结果
    console.log(`图像生成任务已创建，任务ID: ${taskId}，正在等待结果...`);
    const result = await pollTaskResult(taskId, apiKey, abortSignal);

    // 3. 处理并返回结果
    const images = processTaskResult(result);
    return { images };
  } catch (error) {
    console.error('通义万象图像生成失败:', error);
    throw new Error(`图像生成失败: ${(error as Error).message}`);
  }
}

/**
 * 创建图像生成任务
 */
async function createImageTask({
  prompt,
  style,
  size,
  n,
  negativePrompt,
  apiKey,
  abortSignal,
}: GenerateImageOptions & { apiKey: string }): Promise<string> {
  // 基于风格调整模型
  // 默认使用 wanx2.1-t2i-turbo（速度快）
  // 对于 realistic 风格，使用 wanx2.1-t2i-plus（细节更丰富）
  const model = style === 'realistic' ? 'wanx2.1-t2i-plus' : 'wanx2.1-t2i-turbo';

  // 调整提示词以适应所选风格
  let stylePrompt = prompt;
  if (style === 'cartoon') {
    stylePrompt = `${prompt}，卡通风格，可爱，动画效果`;
  } else if (style === 'illustration') {
    stylePrompt = `${prompt}，插画风格，艺术效果，色彩丰富`;
  } else if (style === 'realistic') {
    stylePrompt = `${prompt}，逼真摄影效果，高清细节，写实`;
  }

  const requestBody = {
    model,
    input: {
      prompt: stylePrompt,
      ...(negativePrompt && { negative_prompt: negativePrompt }),
    },
    parameters: {
      size,
      n,
      prompt_extend: true, // 启用智能改写以提高生成质量
      watermark: false, // 不添加水印
    },
  };

  const response = await fetch(CREATE_TASK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable', // 启用异步处理
    },
    body: JSON.stringify(requestBody),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API请求失败 (${response.status}): ${errorData.message || '未知错误'}`);
  }

  const data = (await response.json()) as BailianTaskResponse;
  return data.output.task_id;
}

/**
 * 轮询任务结果
 */
async function pollTaskResult(
  taskId: string,
  apiKey: string,
  abortSignal?: AbortSignal
): Promise<BailianTaskResponse> {
  let attempts = 0;

  // 轮询直到得到结果或超过最大尝试次数
  while (attempts < MAX_POLLING_ATTEMPTS) {
    attempts++;

    // 检查是否已经取消请求
    if (abortSignal?.aborted) {
      throw new Error('操作已取消');
    }

    // 获取任务状态
    const response = await fetch(`${GET_TASK_URL}/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`获取任务结果失败 (${response.status}): ${errorData.message || '未知错误'}`);
    }

    const data = (await response.json()) as BailianTaskResponse;
    const status = data.output.task_status;

    // 根据任务状态处理
    if (status === 'SUCCEEDED') {
      console.log(`图像生成成功，共生成 ${data.output.task_metrics?.SUCCEEDED || 0} 张图片`);
      return data;
    } else if (status === 'FAILED') {
      throw new Error(`任务执行失败: ${data.output.message || '未知错误'}`);
    } else if (status === 'PENDING' || status === 'RUNNING') {
      console.log(`任务正在进行中 (${status})，等待中...（第 ${attempts} 次检查）`);
      // 等待一段时间再次轮询
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      continue;
    } else {
      throw new Error(`未知的任务状态: ${status}`);
    }
  }

  throw new Error(`等待任务结果超时，请稍后查询任务ID: ${taskId}`);
}

/**
 * 处理任务结果，提取图像信息
 */
function processTaskResult(data: BailianTaskResponse): ImageResult[] {
  if (!data.output.results || data.output.results.length === 0) {
    throw new Error('任务结果中没有图像数据');
  }

  return data.output.results
    .filter(result => result.url) // 只保留成功的结果
    .map(result => ({
      url: result.url!,
      prompt: result.orig_prompt || '',
      actualPrompt: result.actual_prompt,
      // 注意：通义万象API不直接返回base64和uint8Array数据
      // 如果需要这些格式，需要额外下载图片并转换
    }));
}

// 图像生成工具定义
const imageGenerationTool: ToolDefinition = {
  toolName: 'generateImageQuery',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('generateImageQuery'));
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: '根据描述生成图像，支持不同风格（卡通、真实、插画）',
      parameters: z.object({
        prompt: z.string().describe('详细的图像描述'),
        style: z
          .enum(['cartoon', 'realistic', 'illustration'])
          .default('cartoon')
          .describe('图像风格，默认为卡通风格'),
        size: z
          .string()
          .optional()
          .default('1024*1024')
          .describe('图像尺寸（宽*高），默认为1024*1024'),
        negativePrompt: z.string().optional().describe('反向提示词，描述不希望在图像中出现的内容'),
      }),
      execute: async ({ prompt, style, size, negativePrompt }, { toolCallId, abortSignal }) => {
        try {
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'generateImageQuery',
              status: 'generating',
              message: `正在生成图像: "${prompt}" (${style}风格)`,
              toolCallId,
            });
          }

          // 使用封装的图像生成函数
          const { images } = await generateImageWithBailian({
            prompt,
            style: style as 'cartoon' | 'realistic' | 'illustration',
            size,
            n: 1, // 暂时只生成一张图片
            negativePrompt,
            abortSignal,
          });

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'generateImageQuery',
              status: 'complete',
              message: '图像生成成功',
              toolCallId,
            });
          }

          // 返回第一张图片的信息
          return {
            imageUrl: images[0].url,
            prompt: images[0].prompt,
            actualPrompt: images[0].actualPrompt,
            style,
          };
        } catch (error) {
          console.error('图像生成错误:', error);
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'generateImageQuery',
              status: 'error',
              message: `图像生成失败: ${(error as Error).message}`,
              toolCallId,
            });
          }
          throw error;
        }
      },
    });
  },
};

export default imageGenerationTool;
