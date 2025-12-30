import { tool } from 'ai';
import { z } from 'zod';
import { getGoogleMapsMCPTools } from './clients';
import { ToolDefinition, ToolConfig, ToolStatus } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';
import { createMapsFormatterAgent } from '../../agents';

// 路线数据可视化类型
export type MapDataForVisualization = {
  operation: string;
  query: string;
  routes: Array<{
    summary: string;
    legs: Array<{
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      steps: Array<{
        html_instructions: string;
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        travel_mode?: string;
      }>;
    }>;
  }>;
};

// 地点搜索可视化类型
export type PlacesSearchVisualization = {
  operation: string;
  query: string;
  places: Array<{
    name: string;
    place_id: string;
    formatted_address: string;
    location: { lat: number; lng: number };
    rating?: number;
    types?: string[];
  }>;
};

// 地理编码可视化类型
export type GeocodeVisualization = {
  operation: string;
  query: string;
  locations: Array<{
    place_id: string;
    formatted_address: string;
    location: { lat: number; lng: number };
  }>;
};

// 为地图工具定义MCP schemas
const googleMapsSchemas = {
  maps_search_places: {
    parameters: z.object({
      query: z.string().describe('要搜索的地点或设施，务必使用英文'),
    }),
  },
  maps_geocode: {
    parameters: z.object({
      address: z.string().describe('要进行地理编码的地址'),
    }),
  },
  maps_reverse_geocode: {
    parameters: z.object({
      latitude: z.number().describe('地理位置的纬度'),
      longitude: z.number().describe('地理位置的经度'),
    }),
  },
  maps_place_details: {
    parameters: z.object({
      place_id: z.string().describe('要获取详情的地点ID'),
    }),
  },
  maps_directions: {
    parameters: z.object({
      origin: z.string().describe('起点位置，务必使用英文'),
      destination: z.string().describe('终点位置，务必使用英文'),
    }),
  },
};

// ==================== 格式化 Output Schemas ====================

// 地点搜索结果 Schema
const placesSearchSchema = z.object({
  operation: z.string().describe('操作类型'),
  query: z.string().describe('查询内容'),
  places: z
    .array(
      z.object({
        name: z.string().describe('地点名称'),
        place_id: z.string().describe('地点ID'),
        formatted_address: z.string().describe('格式化地址'),
        location: z
          .object({
            lat: z.number().describe('纬度数值'),
            lng: z.number().describe('经度数值'),
          })
          .describe('地理坐标'),
        rating: z.number().optional().describe('评分数值'),
        types: z.array(z.string()).optional().describe('地点类型列表'),
      })
    )
    .describe('地点列表'),
});

// 地理编码结果 Schema
const geocodeSchema = z.object({
  operation: z.string().describe('操作类型'),
  query: z.string().describe('查询内容'),
  locations: z
    .array(
      z.object({
        place_id: z.string().describe('地点ID'),
        formatted_address: z.string().describe('格式化地址'),
        location: z
          .object({
            lat: z.number().describe('纬度数值'),
            lng: z.number().describe('经度数值'),
          })
          .describe('地理坐标'),
      })
    )
    .describe('位置列表'),
});

// 路线结果 Schema
const directionsSchema = z.object({
  operation: z.string().describe('操作类型'),
  query: z.string().describe('查询内容'),
  routes: z
    .array(
      z.object({
        summary: z.string().describe('路线摘要'),
        legs: z
          .array(
            z.object({
              start_location: z
                .object({
                  lat: z.number().describe('纬度'),
                  lng: z.number().describe('经度'),
                })
                .describe('起点坐标'),
              end_location: z
                .object({
                  lat: z.number().describe('纬度'),
                  lng: z.number().describe('经度'),
                })
                .describe('终点坐标'),
              distance: z
                .object({
                  text: z.string().describe('距离文本'),
                  value: z.number().describe('距离数值（米）'),
                })
                .describe('距离信息'),
              duration: z
                .object({
                  text: z.string().describe('时间文本'),
                  value: z.number().describe('时间数值（秒）'),
                })
                .describe('时间信息'),
              steps: z
                .array(
                  z.object({
                    html_instructions: z.string().describe('路线指示'),
                    distance: z
                      .object({
                        text: z.string().describe('距离文本'),
                        value: z.number().describe('距离数值（米）'),
                      })
                      .describe('步骤距离'),
                    duration: z
                      .object({
                        text: z.string().describe('时间文本'),
                        value: z.number().describe('时间数值（秒）'),
                      })
                      .describe('步骤时间'),
                    travel_mode: z.string().optional().describe('交通方式'),
                  })
                )
                .describe('导航步骤列表'),
            })
          )
          .describe('路段列表'),
      })
    )
    .describe('路线列表'),
});

const googleMapsTool: ToolDefinition = {
  toolName: 'googleMapsQuery',

  isEnabled: enabledTools => enabledTools.includes(mapToolNameToEnabledTool('googleMapsQuery')),

  createTool: (config: ToolConfig) => {
    return tool({
      description: '使用Google Maps API查询地点、路线、地址坐标等信息，务必使用英文',
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            '地图查询内容，例如"北京天安门附近的餐厅"，如果是路线查询，请使用"起点->终点"的格式'
          ),
        operation: z
          .enum(['geocode', 'reverse_geocode', 'search_places', 'place_details', 'directions'])
          .describe('操作类型'),
      }),
      execute: async ({ query, operation }, { toolCallId }) => {
        // 辅助函数：发送状态消息
        const sendStatus = (
          status: ToolStatus['status'],
          message: string,
          meta?: Record<string, unknown>
        ) => {
          if (config.dataStream) {
            const statusData: ToolStatus = {
              type: 'toolStatus',
              tool: 'googleMapsQuery',
              status,
              message,
              toolCallId,
              ...(meta ? { meta } : {}),
            };
            // 转为JSON字符串再解析回来，确保数据结构兼容JSONValue
            config.dataStream.writeData(JSON.parse(JSON.stringify(statusData)));
          }
        };

        try {
          console.log(`执行Google Maps查询: ${operation} - ${query}`);
          sendStatus('searching', `正在查询地图数据: ${operation} - "${query}"`);

          const mapsTools = await getGoogleMapsMCPTools(googleMapsSchemas);
          sendStatus('processing', `已连接Google Maps服务，正在执行${operation}操作...`);

          let result: unknown;
          switch (operation) {
            case 'geocode':
              if (mapsTools.maps_geocode) {
                result = await mapsTools.maps_geocode.execute(
                  { address: query },
                  { toolCallId, messages: [] }
                );
              }
              break;
            case 'reverse_geocode': {
              const [lat, lng] = query.split(',').map(Number);
              if (mapsTools.maps_reverse_geocode && !isNaN(lat) && !isNaN(lng)) {
                result = await mapsTools.maps_reverse_geocode.execute(
                  { latitude: lat, longitude: lng },
                  { toolCallId, messages: [] }
                );
              }
              break;
            }
            case 'search_places':
              if (mapsTools.maps_search_places) {
                result = await mapsTools.maps_search_places.execute(
                  { query },
                  { toolCallId, messages: [] }
                );
              }
              break;
            case 'place_details':
              if (mapsTools.maps_place_details) {
                result = await mapsTools.maps_place_details.execute(
                  { place_id: query },
                  { toolCallId, messages: [] }
                );
              }
              break;
            case 'directions': {
              const [origin, destination] = query.split('->').map(s => s.trim());
              if (mapsTools.maps_directions && origin && destination) {
                result = await mapsTools.maps_directions.execute(
                  { origin, destination },
                  { toolCallId, messages: [] }
                );
              }
              break;
            }
          }

          if (!result) {
            sendStatus('noResults', `未能获取${operation}的结果`);
            return { error: '未能执行地图操作' };
          }

          sendStatus('formatting', `已获取原始数据，准备进行可视化：${operation}`, {
            operation,
            query,
          });

          // 根据操作类型选择不同的格式化处理
          let visualizeData: unknown;

          switch (operation) {
            case 'search_places':
              visualizeData = await formatPlacesSearchResult(result, operation, query);
              break;
            case 'geocode':
            case 'reverse_geocode':
              visualizeData = await formatGeocodeResult(result, operation, query);
              break;
            case 'directions':
              visualizeData = await formatDirectionsResult(result, operation, query, mapsTools);
              break;
            default:
              // 默认情况，直接返回原始结果
              visualizeData = { operation, query, result };
          }

          sendStatus('complete', `地图数据处理完毕`, {
            operation,
            query,
            summary:
              operation === 'directions' &&
              (visualizeData as MapDataForVisualization).routes?.length
                ? {
                    routeCount: (visualizeData as MapDataForVisualization).routes.length,
                    routeDistance: (visualizeData as MapDataForVisualization).routes[0].legs[0]
                      .distance.text,
                    routeDuration: (visualizeData as MapDataForVisualization).routes[0].legs[0]
                      .duration.text,
                  }
                : operation === 'search_places' &&
                    (visualizeData as PlacesSearchVisualization).places?.length
                  ? {
                      placeCount: (visualizeData as PlacesSearchVisualization).places.length,
                    }
                  : '没有获取到有效数据',
          });

          return {
            ...result,
            visualize: {
              type: 'map',
              data: visualizeData,
            },
          };
        } catch (error: unknown) {
          console.error('Google Maps查询出错:', error);
          sendStatus('error', `地图查询失败: ${(error as Error).message}`);
          return { error: `地图查询失败: ${(error as Error).message}` };
        }
      },
    });
  },
};

// 辅助函数：格式化地点搜索结果
async function formatPlacesSearchResult(
  result: unknown,
  operation: string,
  query: string
): Promise<PlacesSearchVisualization> {
  try {
    const { output } = await createMapsFormatterAgent(placesSearchSchema).generate({
      prompt: `以下是Google Maps API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
查询内容: ${query}

请格式化`,
    });

    return output;
  } catch (error) {
    console.error('格式化地点搜索结果失败:', error);
    return { operation, query, places: [] };
  }
}

// 辅助函数：格式化地理编码结果
async function formatGeocodeResult(
  result: unknown,
  operation: string,
  query: string
): Promise<GeocodeVisualization> {
  try {
    console.log('格式化地理编码结果:', result);

    const { output } = await createMapsFormatterAgent(geocodeSchema).generate({
      prompt: `以下是Google Maps API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
查询内容: ${query}

请格式化`,
    });

    return output;
  } catch (error) {
    console.error('格式化地理编码结果失败:', error);
    return { operation, query, locations: [] };
  }
}

// 辅助函数：通过 geocode 获取坐标
async function geocodeLocation(
  address: string,
  mapsTools: Record<
    string,
    {
      execute: (
        args: Record<string, unknown>,
        options: Record<string, unknown>
      ) => Promise<unknown>;
    }
  >
): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!mapsTools.maps_geocode) return null;

    const result = await mapsTools.maps_geocode.execute(
      { address },
      { toolCallId: 'geocode-for-directions', messages: [] }
    );

    const data = result as { content?: Array<{ text?: string }> };
    if (data.content?.[0]?.text) {
      const parsed = JSON.parse(data.content[0].text);
      // MCP geocode 返回的结构通常是 { location: { lat, lng } } 或 { results: [{ geometry: { location: {...} } }] }
      if (parsed.location) {
        return parsed.location;
      }
      if (parsed.results?.[0]?.geometry?.location) {
        return parsed.results[0].geometry.location;
      }
      // 尝试直接获取 lat/lng
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    }
  } catch (error) {
    console.error('Geocode 获取坐标失败:', error);
  }
  return null;
}

// 辅助函数：格式化路线结果
async function formatDirectionsResult(
  result: unknown,
  operation: string,
  query: string,
  mapsTools?: Record<
    string,
    {
      execute: (
        args: Record<string, unknown>,
        options: Record<string, unknown>
      ) => Promise<unknown>;
    }
  >
): Promise<MapDataForVisualization> {
  try {
    console.log('格式化路线结果:', result);

    const { output } = await createMapsFormatterAgent(directionsSchema).generate({
      prompt: `以下是Google Maps API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
查询内容: ${query}

请格式化为指定的JSON结构。

**注意**：MCP返回的数据可能没有legs数组，请将routes[0]下的distance、duration、steps等直接映射到legs[0]中。
如果原始数据没有start_location和end_location，请设置为 { lat: 0, lng: 0 }，后续会通过geocode补充。`,
    });

    // 验证坐标是否有效，如果为0则使用geocode获取
    if (output.routes?.[0]?.legs?.[0] && mapsTools) {
      const firstLeg = output.routes[0].legs[0];
      const hasInvalidCoords =
        (firstLeg.start_location.lat === 0 && firstLeg.start_location.lng === 0) ||
        (firstLeg.end_location.lat === 0 && firstLeg.end_location.lng === 0);

      if (hasInvalidCoords) {
        console.warn('检测到无效坐标(0,0)，尝试通过geocode获取...');
        // 从query中解析起点和终点 (格式: "起点->终点")
        const [origin, destination] = query.split('->').map(s => s.trim());

        if (origin && destination) {
          const [startCoords, endCoords] = await Promise.all([
            geocodeLocation(origin, mapsTools),
            geocodeLocation(destination, mapsTools),
          ]);

          if (startCoords) {
            console.log('通过geocode获取起点坐标:', startCoords);
            firstLeg.start_location = startCoords;
          }
          if (endCoords) {
            console.log('通过geocode获取终点坐标:', endCoords);
            firstLeg.end_location = endCoords;
          }

          if (!startCoords || !endCoords) {
            console.error('部分坐标获取失败', { origin, destination, startCoords, endCoords });
          }
        }
      }
    }

    return output;
  } catch (error) {
    console.error('格式化路线结果失败:', error);
    return { operation, query, routes: [] };
  }
}

export default googleMapsTool;
