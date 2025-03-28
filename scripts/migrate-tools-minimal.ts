import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env.mjs';
import type { EnabledToolType, AnalysisToolType } from '@/lib/utils/tools/tool-mapping';

// 参数类型枚举值
type ToolParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';
// 工具状态枚举值
type ToolStatus = 'active' | 'deprecated' | 'disabled';

// 预定义的工具列表
const PREDEFINED_TOOLS: {
  name: EnabledToolType;
  display_name: string;
  description: string;
  icon: string;
  implementation_key: AnalysisToolType;
  parameters: {
    name: string;
    display_name: string;
    description: string;
    type: ToolParameterType;
    is_required: boolean;
    default_value: string | number | boolean | string[] | Record<string, unknown> | null;
  }[];
}[] = [
  {
    name: 'webSearch',
    display_name: 'Web Search',
    description: '在互联网上搜索相关信息，获取最新、最相关的内容',
    icon: 'search',
    implementation_key: 'webSearch',
    parameters: [
      {
        name: 'query',
        display_name: 'Search Query',
        description: '搜索查询',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
      {
        name: 'numResults',
        display_name: 'Number of Results',
        description: '返回结果数量，建议3-7个',
        type: 'number' as ToolParameterType,
        is_required: false,
        default_value: 5,
      },
      {
        name: 'useNeural',
        display_name: 'Use Neural Search',
        description: '是否使用神经搜索（更适合语义查询）',
        type: 'boolean' as ToolParameterType,
        is_required: false,
        default_value: true,
      },
    ],
  },
  {
    name: 'knowledgeBase',
    display_name: 'Knowledge Base',
    description: '查询知识库，从上传的文档中获取相关信息',
    icon: 'database',
    implementation_key: 'queryKnowledgeBase',
    parameters: [
      {
        name: 'query',
        display_name: 'Query',
        description: '搜索查询',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
    ],
  },
  {
    name: 'weather',
    display_name: 'Weather',
    description: '获取指定位置的天气信息',
    icon: 'cloud',
    implementation_key: 'getWeather',
    parameters: [
      {
        name: 'location',
        display_name: 'Location',
        description: '位置信息，如"北京"、"上海"',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
    ],
  },
  {
    name: 'wikidata',
    display_name: 'Wikidata',
    description: '通过实体ID获取Wikidata中的结构化信息',
    icon: 'info',
    implementation_key: 'wikidataGetEntity',
    parameters: [
      {
        name: 'entityId',
        display_name: 'Entity ID',
        description: 'Wikidata实体ID，如"Q42"（道格拉斯·亚当斯）',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
    ],
  },
  {
    name: 'smartWikidata',
    display_name: 'Smart Wikidata',
    description: '智能查询Wikidata实体，只需提供实体名称即可获取结构化数据',
    icon: 'brain',
    implementation_key: 'smartWikidataQuery',
    parameters: [
      {
        name: 'query',
        display_name: 'Query',
        description: '要查询的实体名称，如"苏东坡"、"爱因斯坦"',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
    ],
  },
];

const migrateTools = async () => {
  if (!env.DATABASE_URL) {
    throw new Error('数据库URL未配置');
  }

  // 创建连接
  const client = postgres(env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // 首先确保数据库结构正确
    await migrate(db, { migrationsFolder: 'lib/db/migrations' });

    // 插入工具数据
    for (const tool of PREDEFINED_TOOLS) {
      const existing = await db
        .select()
        .from(schema.tools)
        .where(eq(schema.tools.implementation_key, tool.implementation_key))
        .limit(1);

      if (existing.length > 0) {
        // 更新现有记录
        await db
          .update(schema.tools)
          .set({
            name: tool.name,
            display_name: tool.display_name,
            description: tool.description,
            icon: tool.icon,
            status: 'active' as ToolStatus,
            version: '1.0',
            is_public: true,
          })
          .where(eq(schema.tools.implementation_key, tool.implementation_key));
      } else {
        // 使用事务确保完整性
        await db.transaction(async tx => {
          const [inserted] = await tx
            .insert(schema.tools)
            .values({
              name: tool.name,
              display_name: tool.display_name,
              description: tool.description,
              icon: tool.icon,
              status: 'active' as ToolStatus,
              version: '1.0',
              is_public: true,
              implementation_key: tool.implementation_key,
            })
            .returning();

          // 插入参数
          for (const param of tool.parameters) {
            await tx.insert(schema.tool_parameters).values({
              tool_id: inserted.id,
              name: param.name,
              display_name: param.display_name,
              description: param.description,
              type: param.type,
              is_required: param.is_required,
              default_value:
                param.default_value !== null ? JSON.stringify(param.default_value) : null,
            });
          }
        });
      }
    }
  } finally {
    await client.end();
  }
};

// 运行迁移
console.log('🚀 开始工具迁移过程...');
migrateTools()
  .then(() => {
    console.log('🎉 工具迁移成功完成!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 迁移过程出错:', error);
    process.exit(1);
  });
