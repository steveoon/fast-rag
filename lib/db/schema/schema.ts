import {
  pgTable,
  unique,
  pgEnum,
  text,
  varchar,
  timestamp,
  integer,
  vector,
  index,
  pgSchema,
  uuid,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const access_token_status = pgEnum('access_token_status', ['active', 'inactive']);
export const client_status = pgEnum('client_status', ['disabled', 'active', 'pending']);
export const chatbot_status = pgEnum('chatbot_status', ['active', 'disabled']);
export const document_type = pgEnum('document_type', [
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'md',
  'csv',
  'rtf',
  'json',
  'image',
]);

export const access_tokens = pgTable(
  'access_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    description: text('description'),
    status: access_token_status('status').default('active').notNull(),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    expires_at: timestamp('expires_at', { mode: 'string' }),
  },
  table => [unique('access_tokens_token_unique').on(table.token)]
);

export const users = pgSchema('auth').table('users', {
  id: uuid('id').primaryKey(),
});

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    user_id: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    api_key: varchar('api_key', { length: 255 }),
    status: client_status('status').default('active').notNull(),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [
    unique('clients_api_key_unique').on(table.api_key),
    unique('clients_name_user_unique').on(table.name, table.user_id),
  ]
);

export const document_versions = pgTable('document_versions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  document_id: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  name: varchar('name', { length: 255 }), // 移 .notNull()
  storage_url: varchar('storage_url', { length: 1024 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  client_id: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: document_type('type').notNull(),
  storage_url: varchar('storage_url', { length: 1024 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const embeddings = pgTable(
  'embeddings',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    document_version_id: uuid('document_version_id')
      .notNull()
      .references(() => document_versions.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops'))]
);

export const tool_status = pgEnum('tool_status', ['active', 'deprecated', 'disabled']);

// AI 模型表 - 存储可用的 AI 模型字典
export const ai_models = pgTable(
  'ai_models',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    model_id: varchar('model_id', { length: 255 }).notNull(), // e.g. 'anthropic/claude-haiku-4-5'
    display_name: varchar('display_name', { length: 255 }).notNull(), // e.g. 'Claude Haiku 4.5'
    provider: varchar('provider', { length: 50 }).notNull(), // e.g. 'anthropic', 'openai', 'google'
    description: text('description'),
    categories: text('categories').array(), // ['chat', 'general']
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [unique('ai_models_model_id_unique').on(table.model_id)]
);
export const tool_parameter_type = pgEnum('tool_parameter_type', [
  'string',
  'number',
  'boolean',
  'array',
  'object',
]);

export const tools = pgTable(
  'tools',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    display_name: varchar('display_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    icon: varchar('icon', { length: 100 }),
    status: tool_status('status').default('active').notNull(),
    version: varchar('version', { length: 20 }).default('1.0').notNull(),
    is_public: boolean('is_public').default(true).notNull(),
    implementation_key: varchar('implementation_key', { length: 100 }).notNull(),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [
    unique('tools_name_unique').on(table.name),
    unique('tools_implementation_key_unique').on(table.implementation_key),
  ]
);

export const tool_parameters = pgTable(
  'tool_parameters',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    tool_id: uuid('tool_id')
      .notNull()
      .references(() => tools.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    display_name: varchar('display_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    type: tool_parameter_type('type').notNull(),
    is_required: boolean('is_required').default(false).notNull(),
    default_value: jsonb('default_value'),
    enum_values: jsonb('enum_values'),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [unique('tool_parameters_tool_name_unique').on(table.tool_id, table.name)]
);

export const client_tools = pgTable(
  'client_tools',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    tool_id: uuid('tool_id')
      .notNull()
      .references(() => tools.id, { onDelete: 'cascade' }),
    is_enabled: boolean('is_enabled').default(true).notNull(),
    config: jsonb('config'),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [unique('client_tools_client_tool_unique').on(table.client_id, table.tool_id)]
);

// 聊天机器人表
export const chat_bots = pgTable(
  'chat_bots',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    model_id: varchar('model_id', { length: 255 }).default('anthropic/claude-haiku-4-5'),
    status: chatbot_status('status').default('disabled').notNull(),
    url: varchar('url', { length: 1024 }).notNull(),
    example_questions: jsonb('example_questions').$type<string[]>(),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [
    unique('chat_bots_name_client_unique').on(table.name, table.client_id),
    unique('chat_bots_url_unique').on(table.url),
  ]
);

// 聊天机器人工具关联表
export const chat_bot_tools = pgTable(
  'chat_bot_tools',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    chat_bot_id: uuid('chat_bot_id')
      .notNull()
      .references(() => chat_bots.id, { onDelete: 'cascade' }),
    client_tool_id: uuid('client_tool_id')
      .notNull()
      .references(() => client_tools.id, { onDelete: 'cascade' }),
    config: jsonb('config'),
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  table => [unique('chat_bot_tools_bot_tool_unique').on(table.chat_bot_id, table.client_tool_id)]
);

// 聊天机器人知识库关联表
export const chat_bot_knowledge_bases = pgTable('chat_bot_knowledge_bases', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  chat_bot_id: uuid('chat_bot_id')
    .notNull()
    .references(() => chat_bots.id, { onDelete: 'cascade' }),
  document_version_id: uuid('document_version_id')
    .notNull()
    .references(() => document_versions.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const clientsSchema = createInsertSchema(clients);
export const clientsSelectSchema = createSelectSchema(clients);
export const access_tokensSchema = createInsertSchema(access_tokens);
export const access_tokensSelectSchema = createSelectSchema(access_tokens);
export type Client = z.infer<typeof clientsSelectSchema>;
export type ClientInsert = z.infer<typeof clientsSchema>;
export type AccessToken = z.infer<typeof access_tokensSelectSchema>;
export type AccessTokenInsert = z.infer<typeof access_tokensSchema>;
export type DocumentType = (typeof document_type.enumValues)[number];

export const documentsSchema = createInsertSchema(documents);
export const documentsSelectSchema = createSelectSchema(documents);
export type Document = z.infer<typeof documentsSelectSchema>;
export type DocumentInsert = z.infer<typeof documentsSchema>;

export const document_versionsSchema = createInsertSchema(document_versions).extend({
  name: z.string().optional(),
});
export const document_versionsSelectSchema = createSelectSchema(document_versions);
export type DocumentVersion = z.infer<typeof document_versionsSelectSchema>;
export type DocumentVersionInsert = z.infer<typeof document_versionsSchema>;

export const toolsSchema = createInsertSchema(tools);
export const toolsSelectSchema = createSelectSchema(tools);
export type Tool = z.infer<typeof toolsSelectSchema>;
export type ToolInsert = z.infer<typeof toolsSchema>;

export const toolParametersSchema = createInsertSchema(tool_parameters);
export const toolParametersSelectSchema = createSelectSchema(tool_parameters);
export type ToolParameter = z.infer<typeof toolParametersSelectSchema>;
export type ToolParameterInsert = z.infer<typeof toolParametersSchema>;

export const clientToolsSchema = createInsertSchema(client_tools);
export const clientToolsSelectSchema = createSelectSchema(client_tools);
export type ClientTool = z.infer<typeof clientToolsSelectSchema>;
export type ClientToolInsert = z.infer<typeof clientToolsSchema>;

export const chat_botsSchema = createInsertSchema(chat_bots);
export const chat_botsSelectSchema = createSelectSchema(chat_bots);
export type Chatbot = z.infer<typeof chat_botsSelectSchema>;
export type ChatbotInsert = z.infer<typeof chat_botsSchema>;

export const chat_bot_toolsSchema = createInsertSchema(chat_bot_tools);
export const chat_bot_toolsSelectSchema = createSelectSchema(chat_bot_tools);
export type ChatBotTool = z.infer<typeof chat_bot_toolsSelectSchema>;
export type ChatBotToolInsert = z.infer<typeof chat_bot_toolsSchema>;

export const chat_bot_knowledge_basesSchema = createInsertSchema(chat_bot_knowledge_bases);
export const chat_bot_knowledge_basesSelectSchema = createSelectSchema(chat_bot_knowledge_bases);
export type ChatBotKnowledgeBase = z.infer<typeof chat_bot_knowledge_basesSelectSchema>;
export type ChatBotKnowledgeBaseInsert = z.infer<typeof chat_bot_knowledge_basesSchema>;

export const ai_modelsSchema = createInsertSchema(ai_models);
export const ai_modelsSelectSchema = createSelectSchema(ai_models);
export type AiModel = z.infer<typeof ai_modelsSelectSchema>;
export type AiModelInsert = z.infer<typeof ai_modelsSchema>;
