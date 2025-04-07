✨产品需求说明书 PRD：AI旅行图文营销助手（北欧版）

一、产品概述

📌 产品名称（暂定）：

北欧旅行图文助手（Nordic Travel Agent）

🎯 目标用户：
• 私人定制旅行社运营人员（5~20人小团队）
• 主要面向提供"2~8人小团北欧定制游"服务的机构

🛠 核心用途：
• 基于热点内容、用户需求，快速生成小红书/Instagram风格的图文攻略
• 一键生成搭配图像的优质旅游内容
• 实现从灵感获取 → 图文生成 → 社媒分发 的闭环体验

⸻

二、用户使用流程（User Journey）

用户输入需求 → Agent生成攻略内容 → 自动生成搭配图片 → 自动适配小红书/Instagram语气 → 推送/保存内容

示例输入：

"帮我做一篇10月适合去挪威看极光的旅行攻略图文，发布到小红书。"

⸻

三、功能模块设计

1. 输入模块

子功能 说明
内容目标 旅行目的（如：看极光、峡湾游、自驾游等）
时间/季节 例如：9月初、10月中、圣诞节前后
国家/城市 挪威、瑞典、芬兰、冰岛、丹麦等
发布平台 小红书 / Instagram（影响内容风格）
图文风格 可选卡通 / 实景风 / 插画风等（默认卡通）

⸻

四、内容结构模版示例

标题：

【10月去挪威看极光】避开人潮，3天2夜超值小团玩法推荐！

正文结构：

1. ✅ 出发时间建议 + 天气说明
2. 📍 推荐城市与路线（含交通建议）
3. 📷 精选景点介绍 + 小贴士
4. 👗 穿搭建议
5. 🌌 极光预测 + 拍照打卡推荐
6. 📱 实用APP推荐
7. 💬 温馨提示 & 签证指南

⸻

五、待开发与拓展功能（可选）

功能 描述
多语言生成 支持英文/中文双语生成，方便拓展国际市场
地图嵌入 输出可点击交互地图
用户行为记录 跟踪生成偏好，用于内容个性化推荐
社群整合 将内容推送至旅行社的私域运营群/频道

⸻

✅ 大模型需要用到的工具（Tools）分类清单

**核心工具 (Core Tools):**

1.  **`webSearch` (细胞工具 - 已存在):**

    - **用途:** 获取最新旅游政策、签证信息、节庆活动、旅行灵感关键词（如小红书热搜）、景点最新动态、实用APP推荐等时效性信息。也用于补充其他工具无法获取的特定信息。
    - **实现:** 使用 `lib/utils/tools/tool-definitions/web-search.ts` 中的实现，依赖 `exaClient`。

2.  **`getWeather` (细胞工具 - 已存在):**

    - **用途:** 获取指定地点和时间范围的天气预报（气温、降水等），用于行程和穿搭建议。
    - **实现:** 使用 `lib/utils/tools/tool-definitions/weather.ts` 中的实现，依赖 `weatherClient`。需确认数据源对北欧地区的覆盖度和预报精度。

3.  **`getAuroraForecast` (细胞工具 - 新增):**

    - **用途:** 获取指定地点和日期的极光预测信息（如KP指数、可见概率等），对"看极光"类攻略至关重要。
    - **实现:** 需要新增。可先尝试通过 `webSearch` 搜索特定API或网站信息，未来可接入专门的极光预测API。

4.  **`generateImage` (细胞工具 - 新增):**

    - **用途:** 根据攻略内容和用户指定的风格（卡通/实景/插画，默认卡通）生成搭配图片，如城市地图示意图、路线图、景点插画、主题视觉图等。
    - **实现:** 需要新增。接入 DALL·E 3 / Stable Diffusion / Midjourney 等图像生成 API。

5.  **`getPlaceInfo` (复合工具 - 新增/增强):**
    - **用途:** 获取北欧特定城市、景点、地标的详细信息，包括介绍、历史背景、游玩小贴士、交通建议、开放时间、参考门票价格等。这是攻略的核心内容来源。
    - **实现:** 需要新增或基于现有 `smartWikidataQuery` 增强。
      - **思路1 (推荐):** 创建新的复合工具 `getPlaceInfo`。内部逻辑可按需组合调用 `smartWikidataQuery` (获取结构化数据), `wikipediaClient` (获取详细描述), `webSearch` (获取最新动态、游客评价、官网信息等)。负责信息的整合与去重。
      - **思路2:** 沿用 `smartWikidataQuery`，并让 Agent 在需要补充信息时自行调用 `webSearch` 或 `wikipediaClient` (若后者也注册为工具)。
    - 需要选择一种思路实现。

**辅助与可选工具 (Supporting & Optional Tools):**

6.  **`styleAdapter` (通过 Prompt Engineering 实现):**

    - **用途:** 调整输出文案以适应不同社交平台（小红书/Instagram）的语气和风格。
    - **实现:** 主要通过在调用大模型生成最终文本时，在 `system` prompt 和 `user` prompt 中明确指示所需的风格、语气、emoji使用、排版等。**暂不作为独立的 Tool 实现。**

7.  **`knowledgeBase` (细胞工具 - 已存在):**

    - **用途:** (可选) 查询旅行社内部知识库（如常用酒店列表、合作餐厅、内部操作指南等）。对生成公开内容可能不常用，但对内部运营有价值。
    - **实现:** 使用 `lib/utils/tools/tool-definitions/knowledge-base.ts`。

8.  **`routePlanner` (复合工具 - 未来拓展):**

    - **用途:** 根据用户输入的目的地、天数、兴趣点，自动生成简单的行程路线建议（包含每日地点、活动概要、交通方式建议）。
    - **实现:** 复杂度较高，可作为 V2 功能。未来可接入地图API、交通API或专门的行程规划服务，或查找相关 MCP Server。

9.  **`socialPostScheduler` (细胞工具 - 未来拓展):**
    - **用途:** 将最终生成的图文内容一键或定时发布到指定社交媒体平台（小红书、Instagram等）。
    - **实现:** 属于分发环节，可作为 V2 功能。未来可调用第三方发布 API (如 Buffer) 或通过 Webhook 连接 Zapier/Make.com 实现，或查找相关 MCP Server。

⸻

🎯 示例 Agent 能力串联（端到端流程）

假设运营人员输入：

"帮我写一篇关于10月适合去挪威峡湾的旅游攻略图文，用于发小红书，图要可爱一些（卡通风格）。"

Agent 工作流程（示例）:

| 步骤 | 所用 Tool / 动作                     | 目的与产出                                                                                                                                                                                                        |
| :--- | :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **`webSearch`**                      | 查找"挪威10月天气概况"、"热门挪威峡湾"、"峡湾旅行注意事项"。获取宏观信息和初步景点列表。                                                                                                                          |
| 2    | **`getWeather`**                     | 获取用户可能感兴趣的几个主要峡湾区域（如松恩峡湾、盖朗厄尔峡湾）在10月的详细天气预报（气温范围、降水概率）。用于行程和穿搭建议。                                                                                  |
| 3    | **`getPlaceInfo`**                   | 针对选定的核心峡湾景点（如松恩峡湾），获取其详细介绍、特色、游玩方式（游船、徒步路线）、交通建议、小贴士等。这是攻略主体内容。                                                                                    |
| 4    | **`generateImage`**                  | 根据 `getPlaceInfo` 和整体攻略内容，生成"挪威松恩峡湾卡通风格示意图"或"可爱风峡湾游船插画"。参数: `prompt` 由 LLM 生成, `style` 指定为 'cartoon'。                                                                |
| 5    | **LLM (核心处理)**                   | 综合步骤 1-3 获取的所有信息，根据用户要求（小红书风格、10月、挪威峡湾），撰写完整的图文攻略。**通过 Prompt Engineering 实现小红书风格** (口语化、emoji、分点、引导性结尾等)。将步骤 4 生成的图片 URL 嵌入或关联。 |
| 6    | **`socialPostScheduler`** (未来拓展) | (可选) 将生成的图文内容推送到小红书草稿箱或定时发布。                                                                                                                                                             |

⸻

🧠 建议的 Tool Schema（AI SDK `tool` Funtion Signatures）

以下是核心工具的建议函数签名（使用 Zod 定义参数）：

```typescript
// lib/utils/tools/tool-definitions/web-search.ts (参考现有)
import { z } from 'zod';

// 示例 Schema，具体根据 exaClient 调整
const webSearchParameters = z.object({
  query: z.string().describe('搜索查询'),
  numResults: z.number().optional().default(5).describe('返回结果数量'),
  // ... 其他 exa 特定参数
});
// function webSearch(params: z.infer<typeof webSearchParameters>): Promise<SearchResult>;

// lib/utils/tools/tool-definitions/weather.ts (参考现有)
const weatherParameters = z.object({
  location: z.string().describe('查询天气的地点（城市名或经纬度）'),
  date: z.string().optional().describe('查询日期 (YYYY-MM-DD)，默认为今天'),
  // dateRange: z.object({ start: z.string(), end: z.string() }).optional().describe('查询日期范围'), // 或支持范围
});
// function getWeather(params: z.infer<typeof weatherParameters>): Promise<WeatherInfo>;

// lib/utils/tools/tool-definitions/aurora-forecast.ts (新增)
const auroraForecastParameters = z.object({
  location: z.string().describe('查询极光预测的地点（城市名或地理坐标）'),
  date: z.string().optional().describe('查询日期 (YYYY-MM-DD)，默认为今晚'),
});
// function getAuroraForecast(params: z.infer<typeof auroraForecastParameters>): Promise<AuroraInfo>;

// lib/utils/tools/tool-definitions/image-generation.ts (新增)
const imageGenerationParameters = z.object({
  prompt: z.string().describe('生成图片的详细描述'),
  style: z.enum(['cartoon', 'realistic', 'illustration']).default('cartoon').describe('图片风格'),
  // aspectRatio: z.string().optional().describe('图片宽高比，如 "16:9", "1:1"'),
  // size: z.string().optional().describe('图片尺寸，如 "1024x1024"'),
});
// function generateImage(params: z.infer<typeof imageGenerationParameters>): Promise<ImageResult>; // 返回图片URL或标识

// lib/utils/tools/tool-definitions/place-info.ts (新增)
const placeInfoParameters = z.object({
  placeName: z.string().describe('需要查询信息的地点名称（如 "松恩峡湾", "特罗姆瑟"）'),
  // language: z.string().optional().default('zh').describe('期望返回信息的语言'),
});
// function getPlaceInfo(params: z.infer<typeof placeInfoParameters>): Promise<PlaceDetails>; // 返回结构化的地点信息
```
