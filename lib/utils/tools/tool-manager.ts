import { ToolSet } from 'ai';
import { toolDefinitions } from './tool-definitions';
import {
  ToolConfig,
  ToolSelectorConfig,
  AllToolCalls,
  AllToolResults,
  ToolCall,
  ToolResult,
} from './types';
import { mapToolNameToEnabledTool, AnalysisToolType, EnabledToolType } from './tool-mapping';

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
 * 获取工具调用类型 - 用于类型安全的工具调用处理
 * @param tools 工具集合
 */
export type ToolCallsFrom<T extends ToolSet> = AllToolCalls<T>;

/**
 * 获取工具结果类型 - 用于类型安全的工具结果处理
 * @param tools 工具集合
 */
export type ToolResultsFrom<T extends ToolSet> = AllToolResults<T>;

/**
 * 根据查询分析选择适合的工具
 * @param config 工具选择器配置
 * @returns 选择的工具集合
 */
export function selectTools(config: ToolSelectorConfig): ToolSet {
  const { enabledTools, queryAnalysis, allTools } = config;
  const selectedTools: ToolSet = {};

  // Helper function to add a tool if it is enabled and available
  const addTool = (toolName: string) => {
    // 检查是否是有效的分析工具类型
    try {
      // 尝试将工具名称转换为启用工具类型
      const enabledToolName = mapToolNameToEnabledTool(toolName as AnalysisToolType);
      if (enabledTools.includes(enabledToolName) && allTools[toolName]) {
        selectedTools[toolName] = allTools[toolName];
      }
    } catch {
      // 如果转换失败，直接检查是否存在
      if (enabledTools.includes(toolName as EnabledToolType) && allTools[toolName]) {
        selectedTools[toolName] = allTools[toolName];
      }
    }
  };

  // Mapping from query types to their default tools
  const queryTypeToolMap: Record<string, string[]> = {
    current: ['webSearch'],
    weather: ['getWeather'],
    travel: [
      'getPlaceInfoQuery',
      'googleMapsQuery',
      'getWeather',
      'webSearch',
      'generateImageQuery',
      'xiaohongshuSearch',
    ],
    location: ['googleMapsQuery'],
    visualization: ['generateImageQuery'],
    academic: ['multiDimensionalSearch', 'webSearch'],
    github: ['multiDimensionalSearch', 'webSearch'],
    webContent: ['multiDimensionalSearch', 'webSearch'],
    social: ['xiaohongshuSearch', 'webSearch'],
  };

  // Apply default tools based on query type
  if (
    queryAnalysis.queryType === 'current' ||
    (queryAnalysis.queryType === 'factual' &&
      !queryAnalysis.requiredTools.includes('queryKnowledgeBase'))
  ) {
    (queryTypeToolMap.current || []).forEach(addTool);
  } else if (queryTypeToolMap[queryAnalysis.queryType]) {
    queryTypeToolMap[queryAnalysis.queryType].forEach(addTool);
  }

  // Process required tools, with special handling for wikidataGetEntity
  queryAnalysis.requiredTools.forEach(toolName => {
    const finalToolName =
      toolName === 'wikidataGetEntity' && enabledTools.includes('smartWikidata')
        ? 'smartWikidataQuery'
        : toolName;
    addTool(finalToolName);
  });

  // Fallback to knowledgeBase tool if no tools have been selected
  if (
    Object.keys(selectedTools).length === 0 &&
    enabledTools.includes('knowledgeBase') &&
    allTools.queryKnowledgeBase
  ) {
    selectedTools.queryKnowledgeBase = allTools.queryKnowledgeBase;
  }

  console.log('选择的工具:', Object.keys(selectedTools));
  return selectedTools;
}

/**
 * 处理工具调用的辅助函数 - 类型安全处理
 * @param tools 工具集合
 * @param toolCalls 工具调用数组
 * @param handler 处理函数
 */
export async function handleToolCalls<T extends ToolSet>(
  tools: T,
  toolCalls: Array<ToolCall<string, Record<string, unknown>>>,
  handler: (toolName: string, input: Record<string, unknown>) => Promise<void>
): Promise<void> {
  for (const toolCall of toolCalls) {
    await handler(toolCall.toolName, toolCall.input);
  }
}

/**
 * 处理工具结果的辅助函数 - 类型安全处理
 * @param tools 工具集合
 * @param toolResults 工具结果数组
 * @param handler 处理函数
 */
export async function handleToolResults<T extends ToolSet>(
  tools: T,
  toolResults: Array<ToolResult<string, Record<string, unknown>, unknown>>,
  handler: (toolName: string, output: unknown) => Promise<void>
): Promise<void> {
  for (const toolResult of toolResults) {
    await handler(toolResult.toolName, toolResult.output);
  }
}

/**
 * 工具描述映射 - 集中管理各工具的描述文本
 */
const toolDescriptionMap: Record<string, string> = {
  webSearch: '用于在互联网上搜索最新、最相关的信息。这是获取时事、最新发展和事实验证的首选工具',
  wikidataGetEntity:
    '用于获取Wikidata中的结构化实体数据，包含属性、关系等信息。适合查询具体的人物、地点、组织等实体的详细信息，但需要知道实体ID',
  smartWikidataQuery:
    '智能查询Wikidata实体，只需提供实体名称（如"苏东坡"）即可获取结构化数据，无需事先知道实体ID',
  generateImageQuery:
    '根据提供的描述生成图片，支持卡通、写实和插画三种风格，可用于创建旅行地点的示意图、路线图等视觉内容',
  getPlaceInfoQuery:
    '获取全球城市、景点、地标的详细旅行信息，包括介绍、历史背景、游玩小贴士、交通建议、最佳访问时间等',
  getWeather: '查询指定地点和日期的天气预报信息，包括温度、降水概率等数据，适用于旅行规划',
  googleMapsQuery: `使用Google Maps API查询地点位置、路线规划、周边搜索等地理信息，支持多种操作:
    * geocode: 将地址转换为坐标
    * reverse_geocode: 将坐标转换为地址
    * search_places: 搜索特定区域内的地点
    * place_details: 获取地点详情
    * directions: 获取两点之间的路线`,
  multiDimensionalSearch: `多维搜索工具，支持三种高级搜索模式:
    * research_paper_search: 搜索学术论文和研究资料，可查找最新的学术成果和专业知识
    * github_search: 搜索GitHub仓库、代码和开发者，了解开源项目和技术实现
    * crawling: 爬取指定网页内容，可同时处理多个URL，获取完整网页信息和结构`,
  xiaohongshuSearch:
    '在小红书平台搜索相关内容，获取笔记、视频等信息。适用于查找旅游、美食、时尚、生活方式等领域的用户分享内容和体验',
};

/**
 * 生成系统提示，描述可用工具
 * @param tools 工具集合
 * @returns 系统提示文本
 */
export function generateToolSystemPrompt(tools: ToolSet): string {
  const toolNames = Object.keys(tools);

  // 如果没有工具可用，返回简化的提示
  if (toolNames.length === 0) {
    return `你是一个智能助手。当前没有可用的工具来获取外部信息。

请基于你的知识直接回答用户的问题。如果问题需要实时信息、最新数据或外部数据源，
请诚实告知用户当前无法访问相关工具来获取这些信息，并尽可能基于已有知识提供帮助。`;
  }

  return `你是一个智能助手，能够根据用户的问题自主决定使用哪些工具来获取信息。

    可用工具:
    ${toolNames
      .map(toolName => {
        const description = toolDescriptionMap[toolName] || toolName;
        return `- ${toolName}: ${description}`;
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
    
    多维搜索工具使用指南:
    - 当用户询问学术论文或研究内容时，使用operation=research_paper_search
    - 当用户需要了解GitHub上的开源项目、代码或开发者时，使用operation=github_search
    - 当用户提供明确的网页链接并需要获取其内容时，使用operation=crawling
    - 爬取网页时，可以提供多个URL（用逗号分隔），如"https://example.com,https://example.org"
    - 对于学术内容，应综合多篇论文的观点，避免仅依赖单一来源
    - 引用GitHub内容时，应提供仓库链接、作者和许可证信息
    
    旅行信息工具使用指南:
    - 对于任何旅行目的地查询，优先使用getPlaceInfoQuery工具获取结构化的旅行信息
    - 结合googleMapsQuery工具获取地理位置、路线规划和周边设施信息
    - 使用getWeather工具获取目的地天气状况，帮助用户进行旅行规划
    - 当需要可视化展示时，可使用generateImageQuery工具生成相关图片

    小红书搜索工具使用指南:
    - 当用户需要了解旅游、美食、时尚、生活方式等领域的用户分享内容时使用
    - 当用户明确提到"小红书"或需要查找真实用户体验和推荐时优先选择
    - 对于旅行攻略、景点推荐、美食探店等需要参考他人实际体验的查询特别有用
    - 返回结果包含笔记标题、作者、点赞数等信息，可帮助判断内容质量
    - 引用小红书内容时，应提供原笔记链接，例如："根据小红书用户分享[1]，..."
    
    Google Maps工具使用指南:
    - 当用户询问"如何到达某地"时，使用directions操作（格式："起点->终点"）
    - 当用户询问"某地在哪里"时，使用geocode操作获取位置
    - 当用户询问"附近有什么"时，使用search_places操作查找周边设施
    - 坐标查询使用"纬度,经度"格式，如"60.3913,5.3221"
    
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
  return `分析以下用户查询，返回分析结果。

用户查询：${content}

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
     - travel: 旅行规划、目的地信息、旅游攻略相关查询
     - location: 地理位置、路线规划、周边设施搜索等地图相关查询
     - visualization: 图像生成、视觉内容创建相关查询
     - academic: 学术论文、研究资料、专业学术内容查询
     - social: 社交媒体内容、观点讨论、Twitter/X平台信息查询
     - webContent: 特定网页内容提取、多个网址内容分析查询
  
  2. requiredTools: 选择解答问题所需的工具
     - queryKnowledgeBase: 适用于内部文档和专有知识
     - getWeather: 适用于天气查询，或需要了解特定地点天气状况
     - webSearch: 适用于需要最新信息、事实核查、流行话题
     - smartWikidataQuery: 适用于需要结构化事实数据的情况，如人物信息、地点数据等（首选）
     - wikidataGetEntity: 仅当已知具体Wikidata实体ID时使用（极少用到）
     - getPlaceInfoQuery: 适用于全球旅行目的地信息查询，可获取城市、景点的详细介绍和旅行建议
     - generateImageQuery: 适用于需要生成图像的场景，如创建旅行地点的示意图、路线图等视觉内容
     - googleMapsQuery: 适用于地理位置查询、路线规划、周边设施搜索等地图相关操作
     - multiDimensionalSearch: 适用于学术内容查询、Twitter/X平台内容搜索或网页内容爬取
     - xiaohongshuSearch: 适用于获取小红书平台上的用户分享内容，包括旅游攻略、美食推荐、时尚和生活方式等
            
  3. reasoningText: 说明你的推理过程

  重要提示：
  - 对于查询人物、地点、组织等实体信息时，应优先选择smartWikidataQuery而非wikidataGetEntity
  - 对于旅行目的地相关的查询，优先考虑使用getPlaceInfoQuery工具和googleMapsQuery工具结合
  - 当查询涉及"如何到达"、"距离多远"、"附近有什么"等地理位置问题时，使用googleMapsQuery工具
  - 当用户需要图片或视觉内容时，应选择generateImageQuery工具
  - 当用户提问涉及学术论文、研究内容时，应优先选择multiDimensionalSearch工具
  - 当用户需要了解GitHub上的开源项目、代码或开发者时，应选择multiDimensionalSearch工具
  - 当用户提供具体网址并需要获取其内容时，应选择multiDimensionalSearch工具
  - 当用户明确提到"小红书"或需要了解旅游、美食、时尚等方面的真实用户体验时，应选择xiaohongshuSearch工具

输出要求：只返回纯 JSON 对象，不要使用 markdown 代码块，不要添加任何额外的解释文字。`;
}
