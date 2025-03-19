import { createClient } from '@supabase/supabase-js';
import { UploadFile, FileUploadRes } from '@/types';
import * as tus from 'tus-js-client';
import { z } from 'zod';
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_URL } from 'constant';
import { logger, handleError, sanitizeFileName, mimeTypeToDocumentType } from '@/lib/utils';
import { validateAPIKey } from '@/lib/api-key';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import { customAlphabet } from 'nanoid';

const uploadFileSchema = z.object({
  file: z.instanceof(Blob, { message: '文件必须是 Blob 类型' }),
  // metadata: z.record(z.unknown()).optional(),
});

const supabase = createClient(SUPABASE_URL!, SUPABASE_PUBLIC_ANON_KEY!);

const safeNanoid = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  21
);

async function uploadFileToStorage({
  file,
  apiKey,
  onProgress,
}: {
  file: UploadFile;
  apiKey: string;
  onProgress: (percent: string) => void;
}): Promise<FileUploadRes> {
  await validateAPIKey(apiKey);

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'file-uploader-test';
  const sanitizedFileName = sanitizeFileName(file.name);
  const path = 'subdir/' + safeNanoid() + '_' + sanitizedFileName;

  const fileStream = Readable.from(file.buffer);

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(fileStream, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${SUPABASE_PUBLIC_ANON_KEY}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type,
        cacheControl: '3600',
        filename: sanitizedFileName,
        ...(file.metadata && { customMetadata: JSON.stringify(file.metadata) }),
      },
      chunkSize: 6 * 1024 * 1024,
      uploadSize: file.size,
      onError: error => {
        handleError(error);
        reject(error);
        cleanup();
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        logger.info(`上传进度: ${percent}%`);
        onProgress(percent);
      },
      onSuccess: () => {
        logger.info('上传成功');
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          extension: file.extension,
          uploadURL: urlData.publicUrl,
          docName: file.docName,
        });
        cleanup();
      },
    });

    upload.start();

    function cleanup() {
      upload.abort();
      fileStream.destroy();
    }
  });
}

export async function upload(args: {
  files: { file: File; docName?: string }[];
  apiKey: string;
  sendProgress: (percent: string, fileName: string) => void;
}) {
  const { files, apiKey, sendProgress } = args;
  const allPromise = [];

  for await (const item of files) {
    const { file, docName } = item;
    const validatedData = uploadFileSchema.parse({
      file,
      // metadata: parsedMetadata,
    });

    const buffer = Buffer.from(await validatedData.file.arrayBuffer());

    const uploadFile: UploadFile = {
      name: file.name,
      type: mimeTypeToDocumentType(file.type, file.name),
      size: file.size,
      lastModified: file.lastModified,
      extension: file.name.split('.').pop() || '',
      buffer,
      docName: docName || '',
      // metadata: validatedData.metadata,
    };

    const onProgress = (percent: string) => sendProgress(percent, file.name);
    allPromise.push(uploadFileToStorage({ file: uploadFile, apiKey, onProgress }));
  }

  const res = await Promise.allSettled(allPromise);

  return res.map(item => {
    return {
      success: item.status === 'fulfilled',
      file: item.status === 'fulfilled' ? item.value : undefined,
      error: item.status === 'rejected' ? item.reason : undefined,
    };
  });
}
