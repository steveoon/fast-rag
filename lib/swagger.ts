import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // 指定API文件夹位置
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Wolian AI API',
        version: '1.0.0',
        description: '私域内容智能检索与对话服务 API 文档',
        contact: {
          name: 'API 支持团队',
          email: 'support@bitewise.cc',
        },
      },
      servers: [
        {
          url: 'https://wolian.ai/v1',
          description: '生产环境',
        },
      ],
      tags: [
        {
          name: '对话',
          description: '与AI助手进行对话的相关接口',
        },
        {
          name: '文档',
          description: '文档管理相关接口',
        },
        {
          name: '客户端',
          description: '客户端管理相关接口',
        },
        {
          name: '工具',
          description: 'AI工具相关接口',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: '在请求头中添加 Bearer {API_KEY} 进行身份验证',
          },
        },
        schemas: {
          Message: {
            type: 'object',
            required: ['role', 'content'],
            properties: {
              role: {
                type: 'string',
                enum: ['user', 'assistant', 'system'],
                description: '消息角色',
              },
              content: {
                type: 'string',
                description: '消息内容',
              },
            },
          },
          ChatRequest: {
            type: 'object',
            required: ['messages'],
            properties: {
              messages: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Message',
                },
                description: '对话消息历史',
              },
              docs: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: '要检索的文档ID列表',
              },
              docVersions: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: '文档版本ID列表',
              },
              similarityThreshold: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: '相似度阈值，范围0-1',
              },
              model: {
                type: 'string',
                default: 'openai:gpt-4o-2024-11-20',
                description: '使用的模型ID',
              },
              enabledTools: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['knowledgeBase', 'webSearch', 'weather', 'wikidata', 'smartWikidata'],
                },
                default: ['knowledgeBase', 'smartWikidata'],
                description: '启用的工具列表',
              },
              maxSteps: {
                type: 'number',
                default: 5,
                description: '最大执行步骤数',
              },
            },
            example: {
              messages: [
                {
                  role: 'user',
                  content: '请告诉我关于量子计算的信息',
                },
              ],
              docs: ['doc_123', 'doc_456'],
              docVersions: ['1.0', '2.0'],
              similarityThreshold: 0.8,
              model: 'openai:gpt-4o-2024-11-20',
              enabledTools: ['knowledgeBase', 'webSearch'],
              maxSteps: 5,
            },
          },
          Document: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '文档ID',
              },
              name: {
                type: 'string',
                description: '文档名称',
              },
              size: {
                type: 'number',
                description: '文档大小（字节）',
              },
              fileType: {
                type: 'string',
                description: '文件类型',
                example: 'pdf',
              },
              uploadAt: {
                type: 'string',
                format: 'date-time',
                description: '上传时间',
              },
              status: {
                type: 'string',
                enum: ['processing', 'completed', 'failed'],
                description: '处理状态',
              },
              currentVersion: {
                type: 'string',
                description: '当前版本ID',
              },
              pageCount: {
                type: 'number',
                description: '页数',
              },
              indexCount: {
                type: 'number',
                description: '索引数量',
              },
            },
          },
          DocumentVersion: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '版本ID',
              },
              documentId: {
                type: 'string',
                description: '文档ID',
              },
              version: {
                type: 'string',
                description: '版本号',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: '创建时间',
              },
              status: {
                type: 'string',
                enum: ['processing', 'completed', 'failed'],
                description: '处理状态',
              },
              size: {
                type: 'number',
                description: '文件大小（字节）',
              },
              pageCount: {
                type: 'number',
                description: '页数',
              },
              indexCount: {
                type: 'number',
                description: '索引数量',
              },
            },
          },
          UploadedFile: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '文件ID',
              },
              fileName: {
                type: 'string',
                description: '文件名称',
              },
              fileType: {
                type: 'string',
                description: '文件类型',
              },
              size: {
                type: 'number',
                description: '文件大小（字节）',
              },
              url: {
                type: 'string',
                description: '文件URL',
              },
              uploadedAt: {
                type: 'string',
                format: 'date-time',
                description: '上传时间',
              },
            },
          },
          Client: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '客户端ID',
              },
              name: {
                type: 'string',
                description: '客户端名称',
              },
              userId: {
                type: 'string',
                description: '关联的用户ID',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: '创建时间',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: '更新时间',
              },
            },
          },
          APIKey: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '密钥ID',
              },
              clientId: {
                type: 'string',
                description: '关联的客户端ID',
              },
              hashedToken: {
                type: 'string',
                description: '密钥的哈希值',
              },
              description: {
                type: 'string',
                description: '密钥描述',
              },
              isActive: {
                type: 'boolean',
                description: '是否是活跃密钥',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: '创建时间',
              },
              expiresAt: {
                type: 'string',
                format: 'date-time',
                description: '过期时间',
              },
            },
          },
          EmbeddingRequest: {
            type: 'object',
            required: ['files'],
            properties: {
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['fileId', 'versionId'],
                  properties: {
                    fileId: {
                      type: 'string',
                      description: '文档ID',
                    },
                    versionId: {
                      type: 'string',
                      description: '文档版本ID',
                    },
                  },
                },
                description: '要处理的文件列表',
              },
              force: {
                type: 'boolean',
                description: '是否强制重新生成向量，即使文件已经处理过',
                default: false,
              },
            },
          },
          ClientTool: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: '客户端工具关联ID',
              },
              tool_id: {
                type: 'string',
                description: '工具ID',
              },
              name: {
                type: 'string',
                description: '工具名称',
              },
              description: {
                type: 'string',
                description: '工具描述',
              },
              is_enabled: {
                type: 'boolean',
                description: '是否启用',
              },
              applied_at: {
                type: 'string',
                format: 'date-time',
                description: '应用时间',
              },
            },
          },
          ApplyToolsRequest: {
            type: 'object',
            required: ['toolIds'],
            properties: {
              toolIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: '要应用的工具ID列表',
                minItems: 1,
              },
            },
            example: {
              toolIds: ['knowledgeBase', 'webSearch', 'weather'],
            },
          },
          UpdateToolStatusRequest: {
            type: 'object',
            required: ['id', 'is_enabled'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: '客户端工具关联ID',
              },
              is_enabled: {
                type: 'boolean',
                description: '是否启用工具',
              },
            },
            example: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              is_enabled: true,
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: '错误消息',
              },
              details: {
                type: 'object',
                description: '详细错误信息',
              },
              code: {
                type: 'string',
                description: '错误代码',
              },
            },
            example: {
              error: '请求参数无效',
              details: {
                messages: '至少需要一条消息',
              },
              code: 'VALIDATION_ERROR',
            },
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });
  return spec;
};
