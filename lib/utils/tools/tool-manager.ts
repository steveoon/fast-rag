import { ToolSet } from 'ai';
import { toolDefinitions } from './tool-definitions';
import { ToolConfig, ToolSelectorConfig } from './types';
import { mapToolNameToEnabledTool } from './tool-mapping';

/**
 * 根据配置创建所有可用的工具
 * @param config 工具配置
 * @returns 工具集合
 */
export function createTools(config: ToolConfig): ToolSet {
  const allTools: ToolSet = {};

  // 遍历所有工具定义，创建启用的工具
  toolDefinitions.forEach(toolDef => {
    if (toolDef.isEnabled(config.enabledTools)) {
      allTools[toolDef.toolName] = toolDef.createTool(config);
    }
  });

  return allTools;
}

/**
 * 根据查询分析选择适合的工具
 * @param config 工具选择器配置
 * @returns 选择的工具集合
 */
export function selectTools(config: ToolSelectorConfig): ToolSet {
  const { enabledTools, queryAnalysis, allTools } = config;
  const selectedTools: ToolSet = {};

  // 基于查询类型添加首选工具
  if (
    queryAnalysis.queryType === 'current' ||
    (queryAnalysis.queryType === 'factual' &&
      !queryAnalysis.requiredTools.includes('queryKnowledgeBase'))
  ) {
    // 当前事件和一些事实查询默认优先使用web搜索
    if (enabledTools.includes('webSearch') && allTools.webSearch) {
      selectedTools.webSearch = allTools.webSearch;
    }
  }

  // 特殊处理：当检测到需要使用wikidataGetEntity时，优先使用smartWikidataQuery替代
  const optimizedRequiredTools = queryAnalysis.requiredTools.map(toolName => {
    if (toolName === 'wikidataGetEntity' && enabledTools.includes('smartWikidata')) {
      console.log('自动将wikidataGetEntity工具替换为smartWikidataQuery');
      return 'smartWikidataQuery' as const;
    }
    return toolName;
  });

  // 添加分析推荐的工具
  optimizedRequiredTools.forEach(toolName => {
    const mappedToolName = mapToolNameToEnabledTool(toolName);
    if (allTools[toolName] && enabledTools.includes(mappedToolName)) {
      selectedTools[toolName] = allTools[toolName];
    }
  });

  // 确保至少有一个工具可用
  if (Object.keys(selectedTools).length === 0) {
    // 回退到知识库工具
    if (enabledTools.includes('knowledgeBase') && allTools.queryKnowledgeBase) {
      selectedTools.queryKnowledgeBase = allTools.queryKnowledgeBase;
    }
  }

  console.log('选择的工具:', Object.keys(selectedTools));
  return selectedTools;
}

/**
 * 生成系统提示，描述可用工具
 * @param tools 工具集合
 * @returns 系统提示文本
 */
export function generateToolSystemPrompt(tools: ToolSet): string {
  return `你是一个智能助手，能够根据用户的问题自主决定使用哪些工具来获取信息。

    可用工具:
    ${Object.keys(tools)
      .map(tool => {
        if (tool === 'webSearch') {
          return `- webSearch: 用于在互联网上搜索最新、最相关的信息。这是获取时事、最新发展和事实验证的首选工具`;
        } else if (tool === 'wikidataGetEntity') {
          return `- wikidataGetEntity: 用于获取Wikidata中的结构化实体数据，包含属性、关系等信息。适合查询具体的人物、地点、组织等实体的详细信息，但需要知道实体ID`;
        } else if (tool === 'smartWikidataQuery') {
          return `- smartWikidataQuery: 智能查询Wikidata实体，只需提供实体名称（如"苏东坡"）即可获取结构化数据，无需事先知道实体ID`;
        } else {
          return `- ${tool}`;
        }
      })
      .join('\n')}
    
    工作流程:
    1. 分析用户问题，确定需要使用哪些工具
    2. 调用相应工具获取信息
    3. 综合所有信息提供最终答案
    
    Wikidata工具使用指南:
    - 对于需要事实信息的查询（如人物、地点、组织等），优先使用smartWikidataQuery工具
    - 只有在已知实体ID的情况下，才直接使用wikidataGetEntity工具
    - Wikidata实体ID通常以Q开头，如Q42代表"道格拉斯·亚当斯"
    
    webSearch工具使用指南:
    - 对于需要最新信息的查询，优先使用webSearch
    - 在搜索结果中寻找多个来源的共识，识别可靠的信息
    - 检查搜索结果的发布日期，优先参考最新的信息
    - 当结果包含数字、统计数据或具体观点时，始终标明信息来源
    
    回答要求:
    - 回答要基于工具调用获取的信息
    - 如果工具调用没有返回相关信息，请诚实告知用户"抱歉，我无法找到相关信息"
    - 回答要简洁明了，逻辑清晰
    - 如果信息来自多个来源，请在回答中注明信息来源
    - 使用webSearch工具时，请在引用信息后使用引用标记，例如："根据搜索结果[1]，..."
    - 如果多个搜索结果提供相似信息，可以综合引用："根据多个来源[1][2][3]，..."
    - 确保提供的信息是准确的，避免添加不存在于原始内容中的细节
    - 当搜索结果有冲突时，指出不同来源的差异，而不是随意选择一个`;
}

/**
 * 生成查询分析的提示
 * @param content 用户内容
 * @returns 提示文本
 */
export function generateQueryAnalysisPrompt(content: string): string {
  return `分析以下用户查询：
  ${content}
  
  确定查询类型和需要使用的工具:
  1. queryType: 选择最匹配的查询类型
     - factual: 寻找事实信息
     - opinion: 寻求观点或评价
     - weather: 天气查询
     - knowledge: 专业知识或概念解释
     - current: 最新事件、新闻或趋势
     - technical: 技术类问题
     - comparison: 对比或比较分析
     - historical: 历史事件或过去的信息
  
  2. requiredTools: 选择解答问题所需的工具
     - queryKnowledgeBase: 适用于内部文档和专有知识
     - getWeather: 适用于天气查询
     - webSearch: 适用于需要最新信息、事实核查、流行话题
     - smartWikidataQuery: 适用于需要结构化事实数据的情况，如人物信息、地点数据等（首选）
     - wikidataGetEntity: 仅当已知具体Wikidata实体ID时使用（极少用到）
            
  3. reasoning: 说明你的推理过程

  重要提示：对于查询人物、地点、组织等实体信息时，应优先选择smartWikidataQuery而非wikidataGetEntity。`;
}
