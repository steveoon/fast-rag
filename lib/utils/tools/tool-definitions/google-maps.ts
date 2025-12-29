import { generateObject, tool } from 'ai';
import { z } from 'zod';
import { getGoogleMapsMCPTools } from './clients';
import { ToolDefinition, ToolConfig, ToolStatus } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';
import { registry } from '../../models-registry';

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
              visualizeData = await formatDirectionsResult(result, operation, query);
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
    // console.log('格式化地点搜索结果:', result);

    // 使用generateObject将结果转换为标准化格式
    const { object } = await generateObject({
      model: registry.languageModel('google/gemini-2.0-flash-exp'),
      schema: z.object({
        operation: z.string(),
        query: z.string(),
        places: z.array(
          z.object({
            name: z.string(),
            place_id: z.string(),
            formatted_address: z.string(),
            location: z.object({ lat: z.number(), lng: z.number() }),
            rating: z.number().optional(),
            types: z.array(z.string()).optional(),
          })
        ),
      }),
      prompt: `
        你是一个帮助格式化Google Maps地点搜索API响应的助手。
        以下是Google Maps API的响应:
        ${JSON.stringify(result)}
        
        请将响应格式化为以下结构的JSON:
        {
          "operation": "${operation}",
          "query": "${query}",
          "places": [
            {
              "name": "地点名称",
              "place_id": "地点ID",
              "formatted_address": "格式化地址",
              "location": { "lat": 纬度数值, "lng": 经度数值 },
              "rating": 评分数值(可选),
              "types": ["地点类型1", "地点类型2"](可选)
            }
          ]
        }
        
        注意：请确保所有字段都正确转换，特别是坐标要使用数值类型。
      `,
    });

    return object;
  } catch (error) {
    console.error('格式化地点搜索结果失败:', error);
    // 返回一个基本的格式
    return {
      operation,
      query,
      places: [],
    };
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

    // 使用generateObject将结果转换为标准化格式
    const { object } = await generateObject({
      model: registry.languageModel('google/gemini-2.0-flash-exp'),
      schema: z.object({
        operation: z.string(),
        query: z.string(),
        locations: z.array(
          z.object({
            place_id: z.string(),
            formatted_address: z.string(),
            location: z.object({ lat: z.number(), lng: z.number() }),
          })
        ),
      }),
      prompt: `
        你是一个帮助格式化Google Maps地理编码API响应的助手。
        以下是Google Maps API的响应:
        ${JSON.stringify(result)}
        
        请将响应格式化为以下结构的JSON:
        {
          "operation": "${operation}",
          "query": "${query}",
          "locations": [
            {
              "place_id": "地点ID",
              "formatted_address": "格式化地址",
              "location": { "lat": 纬度数值, "lng": 经度数值 }
            }
          ]
        }
        
        注意：请确保所有字段都正确转换，特别是坐标要使用数值类型。
      `,
    });

    return object;
  } catch (error) {
    console.error('格式化地理编码结果失败:', error);
    // 返回一个基本的格式
    return {
      operation,
      query,
      locations: [],
    };
  }
}

// 辅助函数：格式化路线结果
async function formatDirectionsResult(
  result: unknown,
  operation: string,
  query: string
): Promise<MapDataForVisualization> {
  try {
    console.log('格式化路线结果:', result);

    // 使用原有的generateObject将结果转换为标准化格式
    const { object } = await generateObject({
      model: registry.languageModel('google/gemini-2.0-flash-exp'),
      schema: z.object({
        operation: z.string(),
        query: z.string(),
        routes: z.array(
          z.object({
            summary: z.string(),
            legs: z.array(
              z.object({
                start_location: z.object({ lat: z.number(), lng: z.number() }),
                end_location: z.object({ lat: z.number(), lng: z.number() }),
                distance: z.object({ text: z.string(), value: z.number() }),
                duration: z.object({ text: z.string(), value: z.number() }),
                steps: z.array(
                  z.object({
                    html_instructions: z.string(),
                    distance: z.object({ text: z.string(), value: z.number() }),
                    duration: z.object({ text: z.string(), value: z.number() }),
                    travel_mode: z.string().optional(),
                  })
                ),
              })
            ),
          })
        ),
      }),
      prompt: `
        你是一个帮助格式化Google Maps路线API响应的助手。
        以下是Google Maps API的响应:
        ${JSON.stringify(result)}
        
        请将响应格式化为以下结构的JSON:
        {
          "operation": "${operation}",
          "query": "${query}",
          "routes": [
            {
              "summary": "路线摘要",
              "legs": [
                {
                  "start_location": { "lat": 数值, "lng": 数值 },
                  "end_location": { "lat": 数值, "lng": 数值 },
                  "distance": { "text": "距离文本", "value": 数值 },
                  "duration": { "text": "时间文本", "value": 数值 },
                  "steps": [
                    {
                      "html_instructions": "路线指示",
                      "distance": { "text": "距离文本", "value": 数值 },
                      "duration": { "text": "时间文本", "value": 数值 },
                      "travel_mode": "交通方式"
                    }
                  ]
                }
              ]
            }
          ]
        }
        
        注意：请确保所有字段都正确转换，特别是坐标要使用数值类型。
      `,
    });

    return object;
  } catch (error) {
    console.error('格式化路线结果失败:', error);
    // 返回一个基本的格式
    return {
      operation,
      query,
      routes: [],
    };
  }
}

export default googleMapsTool;
