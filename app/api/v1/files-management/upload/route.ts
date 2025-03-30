import { upload, addDoc } from '@/lib/actions';
import { CustomError, FileUploadRes } from '@/types';
import { extractApiKey, handleError } from '@/lib/utils';

/**
 * @swagger
 * /api/v1/files-management/upload:
 *   post:
 *     summary: 上传文档
 *     description: 上传一个或多个文档文件，并返回上传进度流
 *     tags:
 *       - 文档
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 要上传的文件（可以是多个）
 *               docNames:
 *                 type: string
 *                 description: JSON 字符串，包含文件名映射
 *     responses:
 *       200:
 *         description: 文件上传进度流
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 percent:
 *                   type: string
 *                   description: 上传进度百分比
 *                 fileName:
 *                   type: string
 *                   description: 当前上传的文件名
 *                 completed:
 *                   type: boolean
 *                   description: 是否完成上传
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadedFile'
 *                   description: 上传成功的文件列表
 *                 error:
 *                   type: string
 *                   description: 错误信息（如果有）
 *       400:
 *         description: 请求错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权，API Key 无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (percent: string, fileName: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ percent, fileName })}\n\n`));
  };

  try {
    const apiKey = extractApiKey(request);

    const formData = await request.formData();
    const keys = [...formData.keys()].filter(item => item.includes('file'));
    const docNames = JSON.parse(formData.get('docNames') as string);
    const files = keys.map(key => ({
      file: formData.get(key) as File,
      docName: docNames[key],
    }));

    if (!files.length) {
      throw new CustomError('未提供文件', 'MISSING_FILE');
    }

    upload({ files, apiKey, sendProgress })
      .then(async res => {
        const uploadFiles = res.filter(item => item.success && item.file).map(item => item.file);

        await addDoc(uploadFiles as FileUploadRes[], apiKey);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ completed: true, files: uploadFiles })}\n\n`)
        );
        await writer.close();
      })
      .catch(async error => {
        const { message, code, details } = handleError(error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: message, details, code })}\n\n`)
        );
        await writer.close();
      });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const { message, code, details } = handleError(error);
    await writer.write(
      encoder.encode(`data: ${JSON.stringify({ error: message, details, code })}\n\n`)
    );
    await writer.close();
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
}
