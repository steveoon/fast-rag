import { relations } from 'drizzle-orm/relations';
import {
  clients,
  users,
  access_tokens,
  documents,
  document_versions,
  embeddings,
  tools,
  tool_parameters,
  client_tools,
} from './schema';

export const access_tokensRelations = relations(access_tokens, ({ one }) => ({
  client: one(clients, {
    fields: [access_tokens.client_id],
    references: [clients.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  access_tokens: many(access_tokens),
  documents: many(documents),
  client_tools: many(client_tools),
  user: one(users, {
    fields: [clients.user_id],
    references: [users.id],
  }),
}));

export const document_versionsRelations = relations(document_versions, ({ one, many }) => ({
  document: one(documents, {
    fields: [document_versions.document_id],
    references: [documents.id],
  }),
  embeddings: many(embeddings),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  document_versions: many(document_versions),
  client: one(clients, {
    fields: [documents.client_id],
    references: [clients.id],
  }),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  document_version: one(document_versions, {
    fields: [embeddings.document_version_id],
    references: [document_versions.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  clients: many(clients),
}));

export const toolsRelations = relations(tools, ({ many }) => ({
  parameters: many(tool_parameters),
  client_tools: many(client_tools),
}));

export const tool_parametersRelations = relations(tool_parameters, ({ one }) => ({
  tool: one(tools, {
    fields: [tool_parameters.tool_id],
    references: [tools.id],
  }),
}));

export const client_toolsRelations = relations(client_tools, ({ one }) => ({
  client: one(clients, {
    fields: [client_tools.client_id],
    references: [clients.id],
  }),
  tool: one(tools, {
    fields: [client_tools.tool_id],
    references: [tools.id],
  }),
}));
