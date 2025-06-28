import { queryEmbeddings } from '@/lib/actions/query-embedding';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema/schema';
import * as relations from '@/lib/db/schema/relations';
import { embeddings, documents } from '@/lib/db/schema/schema';
import { sql } from 'drizzle-orm';
import { env } from '@/lib/env.mjs';
import { config } from 'dotenv';

// 确保加载 .env 文件
config();

// 创建自己的数据库连接，使用 env.DATABASE_URL
const client = postgres(env.DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema: { ...schema, ...relations } });

async function testKnowledgeBase() {
  console.log('开始测试知识库查询功能...\n');

  // 对比两种环境变量获取方式
  console.log('=== 环境变量对比 ===');
  console.log('env.DATABASE_URL 存在:', !!env.DATABASE_URL);
  console.log('process.env.DATABASE_URL 存在:', !!process.env.DATABASE_URL);

  if (env.DATABASE_URL && process.env.DATABASE_URL) {
    const envUrl = env.DATABASE_URL.replace(/(:\/\/)([^:]+):([^@]+)(@)/, '$1***:***$4');
    const processEnvUrl = process.env.DATABASE_URL.replace(
      /(:\/\/)([^:]+):([^@]+)(@)/,
      '$1***:***$4'
    );

    console.log('env.DATABASE_URL:', envUrl);
    console.log('process.env.DATABASE_URL:', processEnvUrl);
    console.log('两者是否相同:', env.DATABASE_URL === process.env.DATABASE_URL);
  }
  console.log('========================\n');

  // 检查环境变量
  if (!env.DATABASE_URL) {
    console.error('错误：env.DATABASE_URL 环境变量未设置');
    return;
  }

  // 显示数据库连接信息（隐藏敏感信息）
  const dbUrl = env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/(:\/\/)([^:]+):([^@]+)(@)/, '$1***:***$4');
  console.log(`使用的数据库连接: ${maskedUrl}\n`);

  try {
    // 0. 先测试基本数据库连接
    console.log('0. 测试数据库连接...');
    try {
      await db.execute(sql`SELECT 1 as test`);
      console.log('   数据库连接成功');
    } catch (error) {
      console.error('   数据库连接失败:', error);
      return;
    }

    // 0.1 检查当前数据库和schema
    console.log('\n0.1 检查当前数据库信息...');
    try {
      const dbInfo = await db.execute(sql`
        SELECT current_database() as database_name, current_schema() as schema_name
      `);
      console.log('   当前数据库:', dbInfo[0]);
    } catch (error) {
      console.error('   无法获取数据库信息:', error);
    }

    // 0.2 列出所有表
    console.log('\n0.2 列出所有表...');
    try {
      const tables = await db.execute(sql`
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename
      `);
      console.log('   找到的表:');
      tables.forEach(table => {
        console.log(`     ${table.schemaname}.${table.tablename}`);
      });
    } catch (error) {
      console.error('   无法列出表:', error);
    }

    // 1. 首先检查是否有嵌入数据
    console.log('1. 检查嵌入数据...');
    const embeddingCount = await db.select({ count: sql<number>`count(*)` }).from(embeddings);
    console.log(`   找到 ${embeddingCount[0].count} 条嵌入数据\n`);

    // 2. 获取第一个客户端ID（用于测试）
    console.log('2. 获取测试客户端...');
    const firstDoc = await db.select({ client_id: documents.client_id }).from(documents).limit(1);

    if (!firstDoc.length) {
      console.error('   错误：没有找到任何文档');
      return;
    }

    const testClientId = firstDoc[0].client_id;
    console.log(`   使用客户端ID: ${testClientId}\n`);

    // 3. 测试向量生成
    console.log('3. 测试向量生成...');
    try {
      const { embedding } = await import('@/lib/actions/doc-process/embedding');
      const testVector = await embedding(['测试查询']);
      console.log(`   成功生成向量，维度: ${testVector[0].length}\n`);
    } catch (error) {
      console.error('   向量生成失败:', error);
      return;
    }

    // 4. 测试查询功能
    console.log('4. 测试查询功能...');
    try {
      const results = await queryEmbeddings({
        question: '测试查询',
        clientId: testClientId,
        similarityThreshold: 0.1, // 降低阈值以获得更多结果
      });

      console.log(`   查询返回 ${results.length} 条结果`);
      if (results.length > 0) {
        console.log(`   第一条结果: ${results[0].substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('   查询失败:', error);
      if (error instanceof Error) {
        console.error('   错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
    }

    // 5. 检查 pgvector 扩展
    console.log('\n5. 检查 pgvector 扩展...');
    try {
      const extensionCheck = await db.execute(sql`
        SELECT * FROM pg_extension WHERE extname = 'vector'
      `);

      if (extensionCheck.length > 0) {
        console.log('   pgvector 扩展已安装');
      } else {
        console.error('   错误：pgvector 扩展未安装！');
        console.log('   请运行: CREATE EXTENSION IF NOT EXISTS vector;');
      }
    } catch (error) {
      console.error('   无法检查 pgvector 扩展:', error);
    }
  } catch (error) {
    console.error('\n测试过程中发生错误:', error);
  }
}

// 运行测试
testKnowledgeBase()
  .then(async () => {
    console.log('\n测试完成');
    await client.end();
    process.exit(0);
  })
  .catch(async error => {
    console.error('\n测试失败:', error);
    await client.end();
    process.exit(1);
  });
