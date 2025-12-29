# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fast-RAG is an AI Chatbot and RAG (Retrieval Augmented Generation) Service Platform built with Next.js 15. It enables users to create, manage, and deploy configurable AI agents with private data access through RAG functionality.

## Key Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack on port 3001
pnpm build                  # Build for production
pnpm lint                   # Lint code

# Testing (Vitest)
pnpm test                   # Run all tests
pnpm test path/to/file      # Run specific test file
pnpm test --watch           # Watch mode

# Database (Drizzle ORM)
pnpm db:generate            # Generate migrations from schema changes
pnpm db:migrate             # Apply migrations to database
pnpm db:studio              # Open Drizzle Studio GUI
pnpm db:push                # Push schema directly (dev only)
```

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19
- **Language**: TypeScript (strict mode)
- **UI**: Shadcn UI, Radix UI, Tailwind CSS
- **State**: Zustand for client state
- **Database**: Supabase (PostgreSQL) with Drizzle ORM, pgvector for embeddings
- **AI**: Vercel AI SDK v6, Agentic SDK (OpenAI, Anthropic, Google, Ollama)
- **Auth**: Supabase Auth
- **Caching**: Redis (Upstash) for API key validation
- **i18n**: next-intl (en, ja, zh)

## Data Model Hierarchy

```
User (Supabase Auth)
  └── Client (tenant/organization)
        ├── AccessToken (API keys for client)
        ├── Document → DocumentVersion → Embedding (RAG content)
        ├── ClientTool (tools enabled for client)
        └── ChatBot (AI agents)
              ├── ChatBotTool (tools enabled for bot)
              └── ChatBotKnowledgeBase (linked document versions)
```

Key relationships in `lib/db/schema/schema.ts`:

- Users own Clients (multi-tenant)
- Clients own Documents, ChatBots, and configure available Tools
- ChatBots reference specific ClientTools and DocumentVersions for RAG

## Architecture Patterns

### Server-First Approach

- Prioritize React Server Components (RSC) over client components
- Use Server Actions in `/lib/actions/` for data mutations
- Database queries only in server components/actions
- Mark client components with `"use client"` only when necessary
- Use the `use` hook for data fetching in client components

### API Request Pattern

Use `lib/request` for client-side API calls - it auto-handles API key auth:

```typescript
import api from '@/lib/request';

// Auto-adds Authorization header from active API key
const data = await api.get<DataType>('/endpoint');
await api.post('/items', payload);

// SSE for streaming (file uploads with progress)
api.sse({
  url: '/files-management/upload',
  data: formData,
  onData: data => {
    if (data.percent) updateProgress(data.percent);
    if (data.completed) handleComplete(data.files);
  },
});
```

### Error Handling

Use `lib/utils/error/handle-error.ts` for consistent error handling:

- Handles AI SDK errors (NoSuchToolError, InvalidArgumentError, ToolCallRepairError)
- Handles CustomError, ZodError, and generic Error types
- Returns standardized ErrorResponse with message and code

```typescript
import { handleError } from '@/lib/utils/error/handle-error';
import { CustomError } from '@/types';

// Throw custom errors
throw new CustomError('Something failed', 'ERROR_CODE', { details });

// In catch blocks
catch (error) {
  const { message, code } = handleError(error);
  return NextResponse.json({ error: message }, { status: 500 });
}
```

### AI Tools System

Tool definitions in `/lib/utils/tools/tool-definitions/`. Each tool exports:

```typescript
// Example: lib/utils/tools/tool-definitions/my-tool.ts
import { tool } from 'ai';
import { z } from 'zod';
import { ToolDefinition, ToolConfig, EnabledToolType } from '../types';

const myToolDefinition: ToolDefinition = {
  toolName: 'myTool',
  isEnabled: (enabledTools: EnabledToolType[]) => enabledTools.includes('myTool'),
  createTool: (config: ToolConfig) =>
    tool({
      description: 'Tool description for the AI',
      parameters: z.object({
        query: z.string().describe('Search query'),
      }),
      execute: async ({ query }) => {
        // Implementation
        return result;
      },
    }),
};

export default myToolDefinition;
```

Register new tools in `lib/utils/tools/tool-definitions/index.ts` and add the tool name to `EnabledToolType` in `types.ts`.

The `tool-manager.ts` provides:

- `createTools(config)` - Creates all enabled tools for a chatbot
- `selectTools(config)` - Smart tool selection based on query analysis
- `generateToolSystemPrompt(tools)` - Generates system prompt with tool descriptions

### File Organization

```
/app/api/v1/              # Versioned REST API endpoints
/app/platform/            # Dashboard pages (bots, clients, tools, data management)
/app/chat-bot/[id]/       # Public chatbot interface
/lib/actions/             # Server Actions for data mutations
/lib/db/schema/           # Drizzle ORM schema definitions
/lib/utils/tools/         # AI tool system (tool-definitions/, tool-manager.ts)
/lib/request/             # API client with auto-auth
/lib/api-key/             # API key validation (with Redis caching)
/components/ui/           # Shadcn UI components
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';
import api from '@/lib/request';

interface MyStore {
  data: DataType[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

const useMyStore = create<MyStore>((set, get) => ({
  data: [],
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<DataType[]>('/items');
      set({ data: response.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
```

## Environment Variables

Required variables defined in `lib/env.mjs`:

```bash
DATABASE_URL=              # PostgreSQL connection string
SERVER_SECRET_KEY=         # Server secret for signing
NEXT_PUBLIC_SUPABASE_URL=  # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
```

Optional (for specific tools):

```bash
REDIS_URL=                 # Redis for API key caching
GOOGLE_MAP_API_KEY=        # For Google Maps tool
EXA_API_KEY=               # For web search tool
```

## Conventions

- Husky + commitlint enforces conventional commits
- Use `lowercase-with-dashes` for directories
- Use PascalCase for components, camelCase for functions
- Avoid `any` type - use proper interfaces from `drizzle-zod` schemas
- API routes return consistent `{ data, message, status }` or `{ error }` format
