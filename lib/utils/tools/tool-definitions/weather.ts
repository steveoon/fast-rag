/* eslint-disable @typescript-eslint/no-unused-vars */
import { tool } from 'ai';
import { z } from 'zod';
import { weatherClient } from '@/lib/utils/tools/tool-definitions/clients';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';

const weatherTool: ToolDefinition = {
  toolName: 'getWeather',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('getWeather'));
  },

  createTool: (_: ToolConfig) => {
    return tool({
      description: '获取特定城市的天气信息，城市名称必须转换为英文',
      inputSchema: z.object({
        city: z.string().describe('城市名称，必须转换为英文'),
      }),
      execute: async ({ city }) => {
        return await weatherClient.getCurrentWeather(city);
      },
    });
  },
};

export default weatherTool;
