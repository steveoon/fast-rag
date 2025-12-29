import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/v1/files-management/upload/route';
import { uploadFileToStorage } from '@/lib/actions';
import { extractApiKey, handleError } from '@/lib/utils';

// 模拟依赖
vi.mock('@/lib/actions', () => ({
  uploadFileToStorage: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  extractApiKey: vi.fn(),
  handleError: vi.fn(),
  mimeTypeToDocumentType: vi.fn().mockReturnValue('pdf'),
}));

describe('POST /api/v1/files-management/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 确保 handleError 总是返回一个有效的对象
    vi.mocked(handleError).mockReturnValue({
      message: 'Mock error message',
      code: 'MOCK_ERROR',
      details: 'Mock error details',
    });
  });

  it('应成功上传文件并返回URL', async () => {
    const mockFile = new File(['测试文件内容'], 'test.pdf', { type: 'application/pdf' });
    const mockFormData = new FormData();
    mockFormData.append('file', mockFile);
    mockFormData.append('metadata', JSON.stringify({ key: 'value' }));

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData),
      headers: new Headers({ Authorization: 'Bearer test-api-key' }),
    } as unknown as Request;

    vi.mocked(extractApiKey).mockReturnValue('test-api-key');
    vi.mocked(uploadFileToStorage).mockResolvedValue({
      name: 'test.pdf',
      type: 'pdf',
      size: 100,
      lastModified: Date.now(),
      extension: 'pdf',
      docName: 'test',
      uploadURL: 'https://example.com/uploaded-file.pdf',
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', responseData);

    expect(response.status).toBe(201);
    expect(responseData).toEqual({
      url: 'https://example.com/uploaded-file.pdf',
      isUploaded: true,
    });
    expect(uploadFileToStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test.pdf',
        type: 'pdf',
        size: expect.any(Number),
        lastModified: expect.any(Number),
        extension: 'pdf',
        buffer: expect.any(Buffer),
        metadata: { key: 'value' },
      }),
      'test-api-key'
    );
  });

  it('当未提供文件时应返回错误', async () => {
    const mockFormData = new FormData();
    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData),
      headers: new Headers({ Authorization: 'Bearer test-api-key' }),
    } as unknown as Request;

    vi.mocked(extractApiKey).mockReturnValue('test-api-key');
    vi.mocked(handleError).mockReturnValue({
      message: '未提供文件',
      code: 'MISSING_FILE',
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData).toEqual({
      error: '未提供文件',
      code: 'MISSING_FILE',
    });
  });

  it('当上传过程中发生错误时应处理异常', async () => {
    const mockFile = new File(['测试文件内容'], 'test.pdf', { type: 'application/pdf' });
    const mockFormData = new FormData();
    mockFormData.append('file', mockFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData),
      headers: new Headers({ Authorization: 'Bearer test-api-key' }),
    } as unknown as Request;

    vi.mocked(extractApiKey).mockReturnValue('test-api-key');
    vi.mocked(uploadFileToStorage).mockRejectedValue(new Error('上传失败'));
    vi.mocked(handleError).mockReturnValue({
      message: '操作失败，请稍后重试',
      code: 'UNEXPECTED_ERROR',
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData).toEqual({
      error: '操作失败，请稍后重试',
      code: 'UNEXPECTED_ERROR',
    });
  });
});
