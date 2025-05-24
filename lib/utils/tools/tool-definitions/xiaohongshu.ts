import { tool } from 'ai';
import { z } from 'zod';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';
import { cozeClient } from './clients/index';

// 小红书笔记项目接口
interface XiaohongshuNoteItem {
  model_type: string;
  note_id: string;
  display_title?: string;
  type?: string;
  nickname?: string;
  liked_count?: string;
  avatar?: string;
  cover_url?: string;
  image_list?: string[];
  user_id?: string;
}

// 小红书搜索响应接口
interface XiaohongshuSearchResponse {
  output: {
    has_more: boolean;
    items: XiaohongshuNoteItem[];
  };
}

// 小红书搜索工具
const xiaohongshuTool: ToolDefinition = {
  toolName: 'xiaohongshuSearch',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('xiaohongshuSearch'));
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: '在小红书平台搜索相关内容，获取笔记、视频等信息',
      parameters: z.object({
        query: z.string().describe('搜索关键词'),
      }),
      execute: async ({ query }) => {
        try {
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'xiaohongshuSearch',
              status: 'searching',
              message: `正在小红书搜索: "${query}"`,
            });
          }

          // 默认的小红书cookie
          const defaultCookie =
            'abRequestId=2999c091-e687-5e0c-a620-2a44a632b476; webBuild=4.62.3; xsecappid=xhs-pc-web; a1=1969659a7dbr43ere1kqc4kaw0tf0pjmyjox62pfb30000420748; webId=ad3a91e4a69796b20ae190f0a41bf863; perf_dv6Tr4n=1; gid=yjKjK2jS80vdyjKjK2j0WVJUfDF4qdFdyTASliD4T0E89Cq8i8UV6K8884J8W4Y8S0SfJqqj; acw_tc=0a00d72617466709033018141e3cf5341dd20e6e962c80a44773ff261777c6; loadts=1746670904300; web_session=040069b595dc8d5692a4595e293a4baf9d53b5; unread={%22ub%22:%226812d9b70000000007037dc0%22%2C%22ue%22:%226808d9c4000000001c03e56d%22%2C%22uc%22:28}; websectiga=cffd9dcea65962b05ab048ac76962acee933d26157113bb213105a116241fa6c; sec_poison_id=92f7ae1e-f7b4-4d05-a00e-c0cd53dad30c;';

          // 调用Coze工作流API
          const response = await cozeClient.workflows.runs.create({
            workflow_id: '7501893439564677135',
            parameters: {
              query: query,
              cookie: process.env.XIAOHONGSHU_COOKIE || defaultCookie,
            },
          });

          // 确保响应存在且有有效数据
          if (!response || !response.data) {
            throw new Error('API 调用未返回有效数据');
          }

          // 解析响应数据
          const data: XiaohongshuSearchResponse = JSON.parse(response.data as string);

          if (!data || !data.output || !data.output.items || data.output.items.length === 0) {
            if (config.dataStream) {
              config.dataStream.writeData({
                type: 'toolStatus',
                tool: 'xiaohongshuSearch',
                status: 'noResults',
                message: '未找到相关小红书内容',
              });
            }
            return { results: [], message: '未找到相关小红书内容' };
          }

          // 处理结果
          const items = data.output.items.filter(item => item.model_type !== 'hot_query');

          const processedResults = items.map((item, index) => {
            return {
              id: `[${index + 1}]`,
              title: item.display_title || '无标题',
              noteId: item.note_id,
              type: item.type || '普通笔记',
              nickname: item.nickname || '匿名用户',
              likedCount: item.liked_count || '0',
              avatar: item.avatar,
              coverUrl: item.cover_url,
              imageList: item.image_list,
              // 添加引用标记
              citation: `[${index + 1}](https://www.xiaohongshu.com/explore/${item.note_id})`,
            };
          });

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'xiaohongshuSearch',
              status: 'complete',
              message: `已获取 ${processedResults.length} 个小红书笔记`,
              meta: {
                resultCount: processedResults.length,
                sources: processedResults.map(r => ({
                  title: r.title,
                  url: `https://www.xiaohongshu.com/explore/${r.noteId}`,
                })),
              },
            });
          }

          return {
            results: processedResults,
            message: `找到 ${processedResults.length} 个小红书笔记`,
            searchQuery: query,
            hasMore: data.output.has_more,
          };
        } catch (error) {
          console.error('小红书搜索错误:', error);
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'xiaohongshuSearch',
              status: 'error',
              message: `搜索失败: ${(error as Error).message}`,
            });
          }
          return {
            error: '搜索失败',
            message: (error as Error).message,
            results: [],
          };
        }
      },
    });
  },
};

export default xiaohongshuTool;
