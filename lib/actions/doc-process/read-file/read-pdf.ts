import { extractText, getDocumentProxy } from 'unpdf';

/**
 * 使用 unpdf 解析 PDF 文件
 *
 * 注意：使用 mergePages: false 然后手动合并页面
 * 因为 mergePages: true 会丢失所有换行符，导致分块逻辑失效
 */
export default async function readPdf(content: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(content));
  const { text } = await extractText(pdf, { mergePages: false });

  // text 是 string[]，每个元素是一页的内容
  // 用双换行符连接页面，保证分块逻辑可以正确识别段落边界
  const pages = text as string[];
  return pages.join('\n\n');
}
