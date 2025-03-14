import knowledgeBaseTool from './knowledge-base';
import weatherTool from './weather';
import webSearchTool from './web-search';
import { wikidataEntityTool, smartWikidataQueryTool } from './wikidata';
import { ToolDefinition } from '../types';

// 所有可用工具的定义集合
export const toolDefinitions: ToolDefinition[] = [
  knowledgeBaseTool,
  weatherTool,
  webSearchTool,
  wikidataEntityTool,
  smartWikidataQueryTool,
];

export {
  knowledgeBaseTool,
  weatherTool,
  webSearchTool,
  wikidataEntityTool,
  smartWikidataQueryTool,
};
