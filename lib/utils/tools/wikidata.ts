import { wikidata } from '@agentic/wikidata';
/**
 * 格式化Wikidata属性为可读格式
 * @param entity Wikidata实体对象
 * @returns 格式化后的实体属性
 */
export function formatWikidataProperties(entity: wikidata.SimplifiedEntity | null | undefined) {
  if (!entity || !entity.claims) {
    return {};
  }

  // 提取一些常见的属性（可以根据需要扩展）
  const commonProps: Record<string, unknown> = {};

  // 常见属性的Property ID映射
  const propMap: Record<string, string> = {
    P31: '类型/实例',
    P21: '性别',
    P27: '国籍',
    P569: '出生日期',
    P570: '死亡日期',
    P19: '出生地',
    P20: '死亡地',
    P106: '职业',
    P18: '图片',
    P856: '官方网站',
    P1559: '名称',
    P2561: '名称',
    P571: '创建/成立日期',
    P580: '开始时间',
    P582: '结束时间',
    P625: '地理坐标',
    P131: '行政区划',
    P17: '国家',
    P1082: '人口',
    P281: '邮政编码',
    P1448: '官方名称',
    P577: '出版日期',
    P50: '作者',
    P57: '导演',
    P58: '剧本作者',
    P161: '演员',
    P175: '表演者',
    P407: '语言',
    P495: '原产国',
    P136: '流派',
    P166: '获奖',
    P276: '位置',
    P937: '工作地点',
    P36: '首都',
    P1376: '首都',
  };

  // 处理每个属性
  Object.entries(entity.claims).forEach(([propId, claims]) => {
    const propName = propMap[propId] || propId;
    if (Array.isArray(claims) && claims.length > 0) {
      // 如果一个属性有多个值，作为数组存储
      commonProps[propName] = claims.map((claim: wikidata.Claim) => {
        if (typeof claim.value === 'string') {
          return claim.value;
        }
        return claim;
      });

      // 如果只有一个值，直接存储
      if (
        Array.isArray(commonProps[propName]) &&
        (commonProps[propName] as unknown[]).length === 1
      ) {
        commonProps[propName] = (commonProps[propName] as unknown[])[0];
      }
    }
  });

  return {
    id: entity.id,
    label: entity.labels?.zh || entity.labels?.en,
    description: entity.descriptions?.zh || entity.descriptions?.en,
    properties: commonProps,
  };
}

/**
 * 从文本中提取Wikidata实体ID
 * @param text 包含可能的Wikidata ID的文本
 * @returns 提取到的实体ID或null
 */
export function extractEntityId(text: string): string | null {
  // 仅保留最可靠的匹配模式
  const patterns = [
    /wikidata\.org\/entity\/(Q\d+)/i, // 实体URL格式
    /wikidata\.org\/wiki\/(Q\d+)/i, // Wiki URL格式
    /Wikidata ID[\s\n]*[:：][\s\n]*(Q\d+)/i,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 1 && matches[1].startsWith('Q')) {
      return matches[1];
    }
  }
  return null;
}
