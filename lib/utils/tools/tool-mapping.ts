const TOOL_NAME_MAPPING: Record<AnalysisToolType, EnabledToolType> = {
  queryKnowledgeBase: 'knowledgeBase',
  getWeather: 'weather',
  webSearch: 'webSearch',
  wikidataGetEntity: 'wikidata',
  smartWikidataQuery: 'smartWikidata',
  generateImageQuery: 'generateImage',
  getPlaceInfoQuery: 'getPlaceInfo',
};

// 定义工具类型
export const ENABLED_TOOLS = [
  'knowledgeBase',
  'webSearch',
  'weather',
  'wikidata',
  'smartWikidata',
  'generateImage',
  'getPlaceInfo',
] as const;
export type EnabledToolType = (typeof ENABLED_TOOLS)[number];

// 定义分析工具名称
export const ANALYSIS_TOOLS = [
  'queryKnowledgeBase',
  'getWeather',
  'webSearch',
  'wikidataGetEntity',
  'smartWikidataQuery',
  'generateImageQuery',
  'getPlaceInfoQuery',
] as const;
export type AnalysisToolType = (typeof ANALYSIS_TOOLS)[number];

/**
 * 工具名称映射函数
 * @param toolName 分析工具名称
 * @returns 映射后的启用工具类型
 */
export function mapToolNameToEnabledTool(toolName: AnalysisToolType): EnabledToolType {
  const mapped = TOOL_NAME_MAPPING[toolName];
  if (mapped === undefined) {
    throw new Error(`无法映射工具名称: ${toolName}`);
  }
  return mapped;
}

/**
 * 反向映射工具名称
 * @param toolName 启用工具名称
 * @returns 映射后的分析工具名称
 */
export function mapEnabledToolToAnalysisTool(toolName: EnabledToolType): AnalysisToolType {
  const mapped = Object.entries(TOOL_NAME_MAPPING).find(
    ([, enabledTool]) => enabledTool === toolName
  );
  if (mapped === undefined) {
    throw new Error(`无法反向映射工具名称: ${toolName}`);
  }
  return mapped[0] as AnalysisToolType;
}
