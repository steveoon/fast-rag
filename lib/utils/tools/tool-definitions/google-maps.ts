import { tool } from 'ai';
import { z } from 'zod';
import { getGoogleMapsMCPTools } from './clients';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';

// Google Maps MCP工具定义
const googleMapsTool: ToolDefinition = {
  toolName: 'googleMapsQuery', // 工具内部名称

  // 检查工具是否已启用
  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('googleMapsQuery'));
  },

  // 创建工具实例
  createTool: (config: ToolConfig) => {
    return tool({
      description: '使用Google Maps API查询地点、路线、地址坐标等信息',
      parameters: z.object({
        query: z.string().describe('地图查询内容，例如"北京天安门附近的餐厅"'),
        operation: z
          .enum(['geocode', 'reverse_geocode', 'search_places', 'place_details', 'directions'])
          .describe('操作类型'),
      }),
      execute: async ({ query, operation }, { toolCallId }) => {
        try {
          console.log(`执行Google Maps查询: ${operation} - ${query}`);

          // 使用dataStream通知开始查询
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'googleMapsQuery',
              status: 'searching',
              message: `正在查询地图数据: ${operation} - "${query}"`,
              toolCallId,
            });
          }

          // 获取Google Maps工具
          const mapsTools = await getGoogleMapsMCPTools();

          // 使用dataStream通知获取到MCP工具
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'googleMapsQuery',
              status: 'processing',
              message: `已连接Google Maps服务，正在执行${operation}操作...`,
              toolCallId,
            });
          }

          // 根据操作类型执行对应的MCP工具
          let result;

          // 为switch中的变量声明提供块级作用域
          {
            switch (operation) {
              case 'geocode': {
                if (mapsTools.maps_geocode) {
                  result = await mapsTools.maps_geocode.execute(
                    { address: query },
                    { toolCallId, messages: [] }
                  );
                }
                break;
              }
              case 'reverse_geocode': {
                // 解析坐标字符串，格式如 "39.9042,116.4074"
                const [lat, lng] = query.split(',').map(Number);
                if (mapsTools.maps_reverse_geocode && !isNaN(lat) && !isNaN(lng)) {
                  result = await mapsTools.maps_reverse_geocode.execute(
                    {
                      latitude: lat,
                      longitude: lng,
                    },
                    { toolCallId, messages: [] }
                  );
                }
                break;
              }
              case 'search_places': {
                if (mapsTools.maps_search_places) {
                  result = await mapsTools.maps_search_places.execute(
                    { query },
                    { toolCallId, messages: [] }
                  );
                }
                break;
              }
              case 'place_details': {
                if (mapsTools.maps_place_details) {
                  result = await mapsTools.maps_place_details.execute(
                    { place_id: query },
                    { toolCallId, messages: [] }
                  );
                }
                break;
              }
              case 'directions': {
                // 解析起点和终点，格式如 "北京天安门->北京故宫"
                const [origin, destination] = query.split('->');
                if (mapsTools.maps_directions && origin && destination) {
                  result = await mapsTools.maps_directions.execute(
                    {
                      origin,
                      destination,
                    },
                    { toolCallId, messages: [] }
                  );
                }
                break;
              }
            }
          }

          // 查询完成，通知结果状态
          if (config.dataStream) {
            if (result) {
              config.dataStream.writeData({
                type: 'toolStatus',
                tool: 'googleMapsQuery',
                status: 'complete',
                message: `已完成地图数据查询: ${operation}`,
                toolCallId,
                meta: {
                  operation,
                  query,
                },
              });
            } else {
              config.dataStream.writeData({
                type: 'toolStatus',
                tool: 'googleMapsQuery',
                status: 'noResults',
                message: `未能获取${operation}操作的相关结果`,
                toolCallId,
              });
            }
          }

          return result || { error: '未能执行地图操作' };
        } catch (error: unknown) {
          console.error('Google Maps查询出错:', error);

          // 报告错误状态
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'googleMapsQuery',
              status: 'error',
              message: `地图查询失败: ${(error as Error).message}`,
              toolCallId,
            });
          }

          return {
            error: `地图查询失败: ${(error as Error).message}`,
          };
        }
      },
    });
  },
};

export default googleMapsTool;
