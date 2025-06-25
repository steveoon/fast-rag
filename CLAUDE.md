# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fast-RAG is an AI Chatbot and RAG (Retrieval Augmented Generation) Service Platform built with Next.js 15. It enables users to create, manage, and deploy configurable AI agents with private data access through RAG functionality.

## Key Commands

### Development

```bash
# Start development server with Turbopack on port 3001
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

### Database Management

```bash
# Generate database migrations
pnpm db:generate

# Apply database migrations
pnpm db:migrate

# Open database GUI
pnpm db:studio
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run a specific test file
pnpm test path/to/test.test.ts
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: Shadcn UI, Radix UI, Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **AI SDKs**: Vercel AI SDK, Agentic SDK
- **Authentication**: Supabase Auth
- **Caching**: Redis for API keys
- **Testing**: Vitest with React Testing Library

### Core Architecture Patterns

1. **Server-First Approach**

   - Prioritize React Server Components (RSC) over client components
   - Use Server Actions for data mutations
   - Database queries only in server components/actions
   - Client components marked with "use client" only when necessary

2. **API Design**

   - RESTful API endpoints under `/app/api/v1/`
   - OpenAPI documentation at `/api-docs`
   - Consistent error handling with standardized responses
   - API key authentication via Redis-cached validation

3. **Data Flow**

   - Server Actions in `/lib/actions/` for data operations
   - Zustand stores for client-side state management
   - Use `lib/request` utility for API calls with automatic auth
   - SSE (Server-Sent Events) for real-time streaming

4. **File Organization**
   ```
   /app/               # Next.js pages and API routes
   /components/        # Reusable UI components
   /lib/               # Core business logic
     /actions/         # Server actions
     /db/             # Database schemas and migrations
     /utils/          # Utilities and helpers
       /tools/        # AI tool definitions
   /hooks/            # Custom React hooks
   /types/            # TypeScript type definitions
   ```

### Key Development Principles

1. **TypeScript Best Practices**

   - Avoid `any` type
   - Define proper interfaces for all data structures
   - Use type inference where possible
   - Leverage TypeScript strict mode

2. **Component Guidelines**

   - Functional components only
   - Custom hooks for complex logic
   - Modular, single-responsibility components
   - Proper error boundaries for error handling

3. **Database Access**

   - All database queries through Drizzle ORM
   - Database access only in server components/actions
   - Use transactions for related operations
   - Proper error handling and rollback

4. **AI Integration**
   - Tool definitions in `/lib/utils/tools/`
   - Support for multiple AI providers (OpenAI, Anthropic, Google, Ollama)
   - Configurable tools per chatbot
   - Streaming responses with proper error handling

### Common Development Tasks

1. **Adding a New API Endpoint**

   - Create route handler in `/app/api/v1/[resource]/route.ts`
   - Implement authentication middleware
   - Add proper error handling
   - Update OpenAPI documentation

2. **Creating a New Tool**

   - Define tool in `/lib/utils/tools/`
   - Add to tool registry
   - Create UI component if needed
   - Update tool management interface

3. **Adding Database Tables**

   - Define schema in `/lib/db/schema/`
   - Generate migration: `pnpm db:generate`
   - Apply migration: `pnpm db:migrate`
   - Create corresponding server actions

4. **Implementing New Features**
   - Start with server components when possible
   - Add server actions for data mutations
   - Create Zustand store for client state if needed
   - Implement proper loading and error states

### Environment Setup

Required environment variables:

```bash
DATABASE_URL=               # PostgreSQL connection string
SERVER_SECRET_KEY=          # Server secret for security
NEXT_PUBLIC_SUPABASE_URL=   # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anonymous key
GOOGLE_MAP_API_KEY=         # For Google Maps tool (optional)
REDIS_URL=                  # Redis connection for caching
```

### Testing Guidelines

- Write tests for critical business logic
- Use Vitest for unit tests
- Test server actions separately
- Mock external API calls
- Ensure proper cleanup in tests

### Important Notes

- The project uses Husky for git hooks
- Follow conventional commits (enforced by commitlint)
- Code formatting with Prettier (run automatically on commit)
- ESLint for code quality
- Support for i18n (English, Japanese, Chinese)
- Dark/light theme support throughout
