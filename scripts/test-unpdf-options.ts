/**
 * 测试 unpdf 的不同选项
 */

import { extractText, getDocumentProxy } from 'unpdf';
import fs from 'fs';

const PDF_PATH = '/Users/rensiwen/Downloads/test-doc.pdf';

async function main() {
  const buffer = fs.readFileSync(PDF_PATH);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  console.log('='.repeat(70));
  console.log('测试 unpdf 不同选项');
  console.log('='.repeat(70));

  // 方案 1: mergePages: true (当前使用)
  console.log('\n1. mergePages: true');
  console.log('-'.repeat(50));
  const result1 = await extractText(pdf, { mergePages: true });
  console.log(`类型: ${typeof result1.text}`);
  console.log(`长度: ${result1.text.length}`);
  console.log(`换行符数量: ${(result1.text.match(/\n/g) || []).length}`);
  console.log(`预览: "${(result1.text as string).slice(0, 200)}"`);

  // 方案 2: mergePages: false (逐页)
  console.log('\n2. mergePages: false');
  console.log('-'.repeat(50));
  const result2 = await extractText(pdf, { mergePages: false });
  console.log(`类型: ${Array.isArray(result2.text) ? 'string[]' : typeof result2.text}`);
  console.log(`页数: ${(result2.text as string[]).length}`);

  const pages = result2.text as string[];
  let totalNewlines = 0;
  pages.forEach((page, i) => {
    const newlines = (page.match(/\n/g) || []).length;
    totalNewlines += newlines;
    console.log(`  第 ${i + 1} 页: ${page.length} 字符, ${newlines} 个换行`);
  });
  console.log(`总换行符: ${totalNewlines}`);

  // 方案 3: 手动添加页面分隔符
  console.log('\n3. 手动合并页面（添加 \\n\\n 分隔）');
  console.log('-'.repeat(50));
  const combinedText = pages.join('\n\n');
  console.log(`总长度: ${combinedText.length}`);
  console.log(`双换行数: ${(combinedText.match(/\n\n/g) || []).length}`);

  // 测试分块效果
  const paragraphs = combinedText.split(/\n\s*\n/).filter(p => p.trim());
  console.log(`按 \\n\\n 分割: ${paragraphs.length} 个段落`);

  // 显示前几个段落
  console.log('\n段落预览:');
  paragraphs.slice(0, 3).forEach((p, i) => {
    console.log(`  #${i + 1} (${p.length}字符): "${p.slice(0, 60)}..."`);
  });

  console.log('\n✅ 测试完成');
}

main().catch(console.error);
