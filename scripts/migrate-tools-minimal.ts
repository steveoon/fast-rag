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
  {
    name: 'generateImage',
    display_name: '图像生成',
    description: '根据描述生成图像，支持不同风格（卡通、真实、插画）',
    icon: 'image',
    implementation_key: 'generateImageQuery',
    parameters: [
      {
        name: 'prompt',
        display_name: '图像描述',
        description: '详细的图像描述',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
      {
        name: 'style',
        display_name: '图像风格',
        description: '图像风格，默认为卡通风格',
        type: 'string' as ToolParameterType,
        is_required: false,
        default_value: 'cartoon',
      },
      {
        name: 'size',
        display_name: '图像尺寸',
        description: '图像尺寸（宽*高），默认为1024*1024',
        type: 'string' as ToolParameterType,
        is_required: false,
        default_value: '1024*1024',
      },
      {
        name: 'negativePrompt',
        display_name: '反向提示词',
        description: '反向提示词，描述不希望在图像中出现的内容',
        type: 'string' as ToolParameterType,
        is_required: false,
        default_value: null,
      },
    ],
  },
  {
    name: 'getPlaceInfo',
    display_name: '旅行地点信息',
    description:
      '获取北欧特定城市、景点、地标的详细信息，包括介绍、历史背景、游玩小贴士、交通建议等',
    icon: 'map-pin',
    implementation_key: 'getPlaceInfoQuery',
    parameters: [
      {
        name: 'placeName',
        display_name: '地点名称',
        description: '需要查询信息的地点名称（如 "松恩峡湾", "特罗姆瑟"）',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
      {
        name: 'language',
        display_name: '语言',
        description: '期望返回信息的语言，默认中文',
        type: 'string' as ToolParameterType,
        is_required: false,
        default_value: 'zh',
      },
    ],
  },
  {
    name: 'googleMaps',
    display_name: 'Google 地图',
    description: '使用Google Maps API查询地点、路线、地址坐标等信息，务必使用英文',
    icon: 'map',
    implementation_key: 'googleMapsQuery',
    parameters: [
      {
        name: 'query',
        display_name: '查询内容',
        description:
          '地图查询内容，例如"北京天安门附近的餐厅"，如果是路线查询，请使用"起点->终点"的格式',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
      {
        name: 'operation',
        display_name: '操作类型',
        description:
          '地图操作类型，可选值：geocode(地理编码)、reverse_geocode(反向地理编码)、search_places(搜索地点)、place_details(地点详情)、directions(路线规划)',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: 'search_places',
      },
    ],
  },
  {
    name: 'multiDimensionalSearch',
    display_name: '多维搜索',
    description: '执行学术论文搜索、GitHub仓库搜索或网页内容爬取',
    icon: 'compass',
    implementation_key: 'multiDimensionalSearch',
    parameters: [
      {
        name: 'operation',
        display_name: '操作类型',
        description: '搜索操作类型：学术论文搜索、GitHub仓库搜索或网页爬取',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
      {
        name: 'query',
        display_name: '查询内容',
        description: '搜索查询或URL，如果是crawling操作则可以是逗号分隔的多个URL',
        type: 'string' as ToolParameterType,
        is_required: true,
        default_value: null,
      },
      {
        name: 'numResults',
        display_name: '结果数量',
        description: '返回结果数量（仅适用于搜索操作）',
        type: 'number' as ToolParameterType,
        is_required: false,
        default_value: 5,
      },
    ],
  },
  {
    name: 'xiaohongshu',
    display_name: '小红书搜索',
    description: '在小红书平台搜索相关内容，获取笔记、视频等信息',
    icon: 'heart',
    implementation_key: 'xiaohongshuSearch',
    parameters: [
      {
        name: 'query',
        display_name: '搜索关键词',
        description: '搜索关键词',
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
