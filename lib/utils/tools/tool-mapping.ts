// 定义工具类型
export const ENABLED_TOOLS = [
  'knowledgeBase',
  'webSearch',
  'weather',
  'wikidata',
  'smartWikidata',
] as const;
export type EnabledToolType = (typeof ENABLED_TOOLS)[number];

// 定义分析工具名称
export const ANALYSIS_TOOLS = [
  'queryKnowledgeBase',
  'getWeather',
  'webSearch',
  'wikidataGetEntity',
  'smartWikidataQuery',
] as const;
export type AnalysisToolType = (typeof ANALYSIS_TOOLS)[number];

/**
 * 工具名称映射函数
 * @param toolName 分析工具名称
 * @returns 映射后的启用工具类型
 */
export function mapToolNameToEnabledTool(toolName: AnalysisToolType): EnabledToolType {
  // 处理工具名称和enabledTools中名称的映射
  if (toolName === 'getWeather') {
    return 'weather';
  } else if (toolName === 'queryKnowledgeBase') {
    return 'knowledgeBase';
  } else if (toolName === 'webSearch') {
    return 'webSearch';
  } else if (toolName === 'wikidataGetEntity') {
    return 'wikidata';
  } else if (toolName === 'smartWikidataQuery') {
    return 'smartWikidata';
  }
  // 安全地处理默认情况
  throw new Error(`无法映射工具名称: ${toolName}`);
}
