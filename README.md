# AI 聊天机器人与 RAG 服务平台

本项目旨在构建一个强大的 AI 聊天机器人和 RAG (检索增强生成) 服务平台。利用 Vercel AI SDK、Agentic SDK 和 Drizzle ORM 等现代技术栈，该平台允许用户创建、管理和部署可配置 AI 代理，这些代理能够与私域数据（通过 RAG）和外部工具进行交互，并通过 Open API 提供服务。

### 主要特点

- **聊天机器人管理**: 创建、配置和管理具有不同功能和工具集的 AI 聊天机器人。
- **可配置 AI 工具**: 利用 Agentic SDK 集成和配置多种 AI 工具（如搜索、天气、知识库查询等）。
- **RAG 功能**: 支持多种文档格式（PDF、文本等）的上传、处理和向量化，实现基于私域内容的智能检索。
- **文档版本控制**: (若实现) 支持管理和检索不同版本的文档。
- **API 优先**: 通过 Swagger 自动生成并提供 Open API 文档，方便第三方集成。
- **多租户支持**: (推断) 可能支持多客户/多租户架构。
- **现代 UI**: 使用 Shadcn UI、Radix UI 和 Tailwind CSS 构建用户界面。

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **语言**: TypeScript
- **UI**:
  - [Shadcn UI](https://ui.shadcn.com/)
  - [Radix UI](https://www.radix-ui.com/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Lucide Icons](https://lucide.dev/)
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs/)
- **数据库/ORM**:
  - [Supabase](https://supabase.com/) (PostgreSQL)
  - [Drizzle ORM](https://orm.drizzle.team/)
- **AI**:
  - [Vercel AI SDK](https://sdk.vercel.ai/) (@ai-sdk/react, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic)
  - [Agentic SDK](https://github.com/agentic-ai/agentic) (@agentic/ai-sdk, @agentic/exa, @agentic/wikipedia, etc.)
  - [Ollama Provider](https://github.com/ollama/ollama-js) (ollama-ai-provider)
- **文档处理**: pdf-lib, pdf2json, adm-zip, fast-xml-parser
- **文件上传**: [tus-js-client](https://github.com/tus/tus-js-client)
- **API 文档**: [Swagger UI](https://swagger.io/tools/swagger-ui/), next-swagger-doc
- **认证**: Supabase Auth, Cookies (`cookies-next`)
- **验证**: [Zod](https://zod.dev/)
- **国际化**: [next-intl](https://next-intl-docs.vercel.app/)
- **环境变量**: [@t3-oss/env-nextjs](https://env.t3.gg/)
- **部署**: Vercel / Docker

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+

### 安装步骤

1.  克隆仓库：

    ```bash
    git clone https://github.com/steveoon/fast-rag # 替换为你的仓库 URL
    cd fast-rag
    ```

2.  安装依赖：

    ```bash
    pnpm install
    ```

3.  配置环境变量：

    复制 `.env.example` (如果存在) 为 `.env.local`，并根据 `lib/env.mjs` 中的定义填充必要的环境变量，特别是 `DATABASE_URL` 和其他服务密钥。

    ```bash
    cp .env.example .env.local # 如果 .env.example 存在
    # 编辑 .env.local 文件
    ```

4.  数据库迁移：

    ```bash
    pnpm db:generate # 生成迁移文件 (如果修改了 schema)
    pnpm db:migrate  # 应用迁移到数据库
    ```

5.  启动开发服务器：

    ```bash
    pnpm dev
    ```

    应用默认运行在 `http://localhost:3001` (根据 package.json)。

### 使用方法

1.  访问 `http://localhost:3001` (或你配置的端口) 访问应用界面。
2.  访问 `http://localhost:3001/api-docs` 查看 API 文档。
3.  使用 UI 或 API 进行聊天机器人创建、文档上传、交互等操作。

## 贡献

我们欢迎所有贡献者为这个项目做出贡献。请先阅读我们的贡献指南（如果存在），然后提交一个 Pull Request。

## 许可证

本项目采用 MIT 许可证。
