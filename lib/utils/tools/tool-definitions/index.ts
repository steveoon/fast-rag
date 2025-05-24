import { ToolDefinition } from '../types';
import knowledgeBaseTool from './knowledge-base';
import weatherTool from './weather';
import webSearchTool from './web-search';
import { wikidataEntityTool, smartWikidataQueryTool } from './wikidata';
import imageGenerationTool from './image-generation';
import placeInfoTool from './place-info';
import googleMapsTool from './google-maps';
import multiDimensionalSearchTool from './multi-dimensional-search';
import xiaohongshuTool from './xiaohongshu';

/**
 * 可用的工具定义列表
 */
export const toolDefinitions: ToolDefinition[] = [
  knowledgeBaseTool,
  weatherTool,
  webSearchTool,
  wikidataEntityTool,
  smartWikidataQueryTool,
  imageGenerationTool,
  placeInfoTool,
  googleMapsTool,
  multiDimensionalSearchTool,
  xiaohongshuTool,
];

/**
 * 按名称获取工具定义
 */
export function getToolDefinitionByName(toolName: string): ToolDefinition | undefined {
  return toolDefinitions.find(def => def.toolName === toolName);
}

/**
 * 工具定义的导出
 */
export {
  knowledgeBaseTool,
  weatherTool,
  webSearchTool,
  wikidataEntityTool,
  smartWikidataQueryTool,
  imageGenerationTool,
  placeInfoTool,
  googleMapsTool,
  multiDimensionalSearchTool,
  xiaohongshuTool,
};
