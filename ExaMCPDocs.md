# Exa MCP Server 🔍

[![npm version](https://badge.fury.io/js/exa-mcp-server.svg)](https://badge.fury.io/js/exa-mcp-server)

A Model Context Protocol (MCP) server lets AI assistants like Claude use the Exa AI Search API for web searches. This setup allows AI models to get real-time web information in a safe and controlled way.

## Prerequisites 📋

- An Exa API key
- Node.js (v18 or higher)
- Claude Desktop installed

## Installation 🛠️

### NPM Installation

```bash
npm install -g exa-mcp-server
```

### Using Smithery

To install the Exa MCP server for Claude Desktop automatically via Smithery:

```bash
npx -y @smithery/cli install exa --client claude
```

## Configuration ⚙️

1.  **Configure Claude Desktop to recognize the Exa MCP server**

    You can find `claude_desktop_config.json` inside the settings of Claude Desktop app:

    - Open the Claude Desktop app and enable **Developer Mode** from the top-left menu bar.
    - Once enabled, open **Settings** (also from the top-left menu bar) and navigate to the **Developer Option**, where you'll find the **Edit Config** button. Clicking it will open the `claude_desktop_config.json` file, allowing you to make the necessary edits.

    OR (if you want to open `claude_desktop_config.json` from terminal):

    - **For macOS:**
      Open your Claude Desktop configuration:
      ```bash
      code ~/Library/Application\\ Support/Claude/claude_desktop_config.json
      ```
    - **For Windows:**
      Open your Claude Desktop configuration:
      ```bash
      code %APPDATA%\\Claude\\claude_desktop_config.json
      ```

2.  **Add the Exa server configuration:**

    ```json
    {
      "mcpServers": {
        "exa": {
          "command": "npx",
          "args": ["/path/to/exa-mcp-server/build/index.js"],
          "env": {
            "EXA_API_KEY": "your-api-key-here"
          }
        }
      }
    }
    ```

    Replace `your-api-key-here` with your actual Exa API key from `dashboard.exa.ai/api-keys`.

3.  **Available Tools & Tool Selection**

    The Exa MCP server includes the following tools, which can be enabled by adding the `--tools` flag:

    - `web_search_exa`: Performs real-time web searches with optimized results and content extraction.
    - `research_paper_search`: Specialized search focused on academic papers and research content.
    - `company_research`: Comprehensive company research tool that crawls company websites to gather detailed information about businesses.
    - `crawling`: Extracts content from specific URLs, useful for reading articles, PDFs, or any web page when you have the exact URL.
    - `competitor_finder`: Identifies competitors of a company by searching for businesses offering similar products or services.
    - `linkedin_search`: Search LinkedIn for companies and people using Exa AI. Simply include company names, person names, or specific LinkedIn URLs in your query.
    - `wikipedia_search_exa`: Search and retrieve information from Wikipedia articles on specific topics, giving you accurate, structured knowledge from the world's largest encyclopedia.
    - `github_search`: Search GitHub repositories using Exa AI - performs real-time searches on GitHub.com to find relevant repositories, issues, and GitHub accounts.

    You can choose which tools to enable by adding the `--tools` parameter to your Claude Desktop configuration:

    Specify which tools to enable:

    ```json
    {
      "mcpServers": {
        "exa": {
          "command": "npx",
          "args": [
            "/path/to/exa-mcp-server/build/index.js",
            "--tools=web_search_exa,research_paper_search,company_research,crawling,competitor_finder,linkedin_search,wikipedia_search_exa,github_search"
          ],
          "env": {
            "EXA_API_KEY": "your-api-key-here"
          }
        }
      }
    }
    ```

    For enabling multiple tools, use a comma-separated list:

    ```json
    {
      "mcpServers": {
        "exa": {
          "command": "npx",
          "args": [
            "/path/to/exa-mcp-server/build/index.js",
            "--tools=web_search_exa,research_paper_search,company_research,crawling,competitor_finder,linkedin_search,wikipedia_search_exa,github_search"
          ],
          "env": {
            "EXA_API_KEY": "your-api-key-here"
          }
        }
      }
    }
    ```

    If you don't specify any tools, all tools enabled by default will be used.

4.  **Restart Claude Desktop**

    For the changes to take effect:

    - Completely quit Claude Desktop (not just close the window)
    - Start Claude Desktop again
    - Look for the 🔌 icon to verify the Exa server is connected

## Using via NPX

If you prefer to run the server directly, you can use `npx`:

```bash
# Run with all tools enabled by default
npx exa-mcp-server

# Enable specific tools only
npx exa-mcp-server --tools=web_search_exa

# Enable multiple tools
npx exa-mcp-server --tools=web_search_exa,research_paper_search

# List all available tools
npx exa-mcp-server --list-tools
```

## Troubleshooting 🔧

### Common Issues

- **Server Not Found**
  - Verify the `npm link` is correctly set up
  - Check Claude Desktop configuration syntax
  - Ensure Node.js is properly installed
- **API Key Issues**
  - Confirm your `EXA_API_KEY` is valid
  - Check the `EXA_API_KEY` is correctly set in the Claude Desktop config
  - Verify no spaces or quotes around the API key
- **Connection Issues**
  - Restart Claude Desktop completely
  - Check Claude Desktop logs:
    - Node.js should be minimum v18 (or higher)
  - **macOS**
    ```bash
    tail -n 20 -f ~/Library/Logs/Claude/mcp\\*.log
    ```
  - **Windows**
    ```bash
    type "%APPDATA%\\Claude\\logs\\mcp\\*.log"
    ```

## Source Code

### Code Path: `src/index.ts`

```javascript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Import the tool registry system
import { toolRegistry } from "./tools/index.js";
import { log } from "./utils/logger.js";

dotenv.config();

// Parse command line arguments to determine which tools to enable
const argv = yargs(hideBin(process.argv))
  .option('tools', {
    type: 'string',
    description: 'Comma-separated list of tools to enable (if not specified, all enabled-by-default tools are used)',
    default: ''
  })
  .option('list-tools', {
    type: 'boolean',
    description: 'List all available tools and exit',
    default: false
  })
  .help()
  .argv;

// Convert comma-separated string to Set for easier lookups
const argvObj = argv as any;
const toolsString = argvObj['tools'] || '';
const specifiedTools = new Set<string>(
  toolsString ? toolsString.split(',').map((tool: string) => tool.trim()) : []
);

// List all available tools if requested
if (argvObj['list-tools']) {
  console.log("Available tools:");

  Object.entries(toolRegistry).forEach(([id, tool]) => {
    console.log(`- ${id}: ${tool.name}`);
    console.log(`  Description: ${tool.description}`);
    console.log(`  Enabled by default: ${tool.enabled ? 'Yes' : 'No'}`);
    console.log();
  });

  process.exit(0);
}

// Check for API key after handling list-tools to allow listing without a key
const API_KEY = process.env.EXA_API_KEY;
if (!API_KEY) {
  throw new Error("EXA_API_KEY environment variable is required");
}

/**
 * Exa AI Web Search MCP Server
 *
 * This MCP server integrates Exa AI's search capabilities with Claude and other MCP-compatible clients.
 * Exa is a search engine and API specifically designed for up-to-date web searching and retrieval,
 * offering more recent and comprehensive results than what might be available in an LLM's training data.
 *
 * The server provides tools that enable:
 * - Real-time web searching with configurable parameters
 * - Research paper searches
 * - And more to come!
 */

class ExaServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "exa-search-server",
      version: "0.3.8"
    });

    log("Server initialized");
  }

  private setupTools(): string[] {
    // Register tools based on specifications
    const registeredTools: string[] = [];

    Object.entries(toolRegistry).forEach(([toolId, tool]) => {
      // If specific tools were provided, only enable those.
      // Otherwise, enable all tools marked as enabled by default
      const shouldRegister = specifiedTools.size > 0
        ? specifiedTools.has(toolId)
        : tool.enabled;

      if (shouldRegister) {
        this.server.tool(
          tool.name,
          tool.description,
          tool.schema,
          tool.handler
        );
        registeredTools.push(toolId);
      }
    });

    return registeredTools;
  }

  async run(): Promise<void> {
    try {
      // Set up tools before connecting
      const registeredTools = this.setupTools();

      log(`Starting Exa MCP server with ${registeredTools.length} tools: ${registeredTools.join(', ')}`);

      const transport = new StdioServerTransport();

      // Handle connection errors
      transport.onerror = (error) => {
        log(`Transport error: ${error.message}`);
      };

      await this.server.connect(transport);
      log("Exa Search MCP server running on stdio");
    } catch (error) {
      log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Create and run the server with proper error handling
(async () => {
  try {
    const server = new ExaServer();
    await server.run();
  } catch (error) {
    log(`Fatal server error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})();
```

### Code Path: `src/tools/crawling.ts`

```javascript
import { z } from "zod";
import axios from "axios";
import { toolRegistry, API_CONFIG } from "./config.js";
import { ExaCrawlRequest } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

// Register the crawling tool
toolRegistry["crawling"] = {
  name: "crawling",
  description: "Extract content from specific URLs using Exa AI - performs targeted crawling of web pages to retrieve their full content. Useful for reading articles, PDFs, or any web page when you have the exact URL. Returns the complete text content of the specified URL.",
  schema: {
    url: z.string().describe("The URL to crawl (e.g., 'exa.ai')")
  },
  handler: async ({ url }, extra) => {
    const requestId = `crawling-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logger = createRequestLogger(requestId, 'crawling');

    logger.start(url);

    try {
      // Create a fresh axios instance for each request
      const axiosInstance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY || ''
        },
        timeout: 25000
      });

      const crawlRequest: ExaCrawlRequest = {
        ids: [url],
        text: true,
        livecrawl: 'always'
      };

      logger.log(`Crawling URL: ${url}`);
      logger.log("Sending crawling request to Exa API");

      const response = await axiosInstance.post(
        '/contents',
        crawlRequest,
        { timeout: 25000 }
      );

      logger.log("Received crawling response from Exa API");

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        logger.log("Warning: Empty or invalid response from Exa API for crawling");
        return {
          content: [{
            type: "text" as const,
            text: "No content found at the specified URL. Please check the URL and try again."
          }]
        };
      }

      logger.log(`Successfully crawled content from URL`);

      const result = {
        content: [{
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2)
        }]
      };

      logger.complete();
      return result;
    } catch (error) {
      logger.error(error);

      if (axios.isAxiosError(error)) {
        // Handle Axios errors specifically
        const statusCode = error.response?.status || 'unknown';
        const errorMessage = error.response?.data?.message || error.message;

        logger.log(`Axios error (${statusCode}): ${errorMessage}`);
        return {
          content: [{
            type: "text" as const,
            text: `Crawling error (${statusCode}): ${errorMessage}`
          }],
          isError: true,
        };
      }

      // Handle generic errors
      return {
        content: [{
          type: "text" as const,
          text: `Crawling error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },
  enabled: false  // Disabled by default
};
```

### Code Path: `src/tools/researchPaperSearch.ts`

```javascript
import { z } from "zod";
import axios from "axios";
import { toolRegistry, API_CONFIG } from "./config.js";
import { ExaSearchRequest, ExaSearchResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

// Register the research paper search tool
toolRegistry["research_paper_search"] = {
  name: "research_paper_search",
  description: "Search across 100M+ research papers with full text access using Exa AI - performs targeted academic paper searches with deep research content coverage. Returns detailed information about relevant academic papers including titles, authors, publication dates, and full text excerpts. Control the number of results and character counts returned to balance comprehensiveness with conciseness based on your task requirements.",
  schema: {
    query: z.string().describe("Research topic or keyword to search for"),
    numResults: z.number().optional().describe("Number of research papers to return (default: 5)"),
    maxCharacters: z.number().optional().describe("Maximum number of characters to return for each result's text content (Default: 3000)")
  },
  handler: async ({ query, numResults, maxCharacters }, extra) => {
    const requestId = `research_paper-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logger = createRequestLogger(requestId, 'research_paper_search');

    logger.start(query);

    try {
      // Create a fresh axios instance for each request
      const axiosInstance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY || ''
        },
        timeout: 25000
      });

      const searchRequest: ExaSearchRequest = {
        query,
        category: "research paper",
        type: "auto",
        numResults: numResults || API_CONFIG.DEFAULT_NUM_RESULTS,
        contents: {
          text: {
            maxCharacters: maxCharacters || API_CONFIG.DEFAULT_MAX_CHARACTERS
          },
          livecrawl: 'fallback'
        }
      };

      logger.log("Sending research paper request to Exa API");

      const response = await axiosInstance.post<ExaSearchResponse>(
        API_CONFIG.ENDPOINTS.SEARCH,
        searchRequest,
        { timeout: 25000 }
      );

      logger.log("Received research paper response from Exa API");

      if (!response.data || !response.data.results) {
        logger.log("Warning: Empty or invalid response from Exa API for research papers");
        return {
          content: [{
            type: "text" as const,
            text: "No research papers found. Please try a different query."
          }]
        };
      }

      logger.log(`Found ${response.data.results.length} research papers`);

      const result = {
        content: [{
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2)
        }]
      };

      logger.complete();
      return result;
    } catch (error) {
      logger.error(error);

      if (axios.isAxiosError(error)) {
        // Handle Axios errors specifically
        const statusCode = error.response?.status || 'unknown';
        const errorMessage = error.response?.data?.message || error.message;

        logger.log(`Axios error (${statusCode}): ${errorMessage}`);
        return {
          content: [{
            type: "text" as const,
            text: `Research paper search error (${statusCode}): ${errorMessage}`
          }],
          isError: true,
        };
      }

      // Handle generic errors
      return {
        content: [{
          type: "text" as const,
          text: `Research paper search error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },
  enabled: false  // disabled by default
};
```

### Code Path: `src/tools/githubSearch`

```javascript
import { z } from "zod";
import axios from "axios";
import { toolRegistry, API_CONFIG } from "./config.js";
import { ExaSearchRequest, ExaSearchResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

// Register the GitHub search tool
toolRegistry["github_search"] = {
  name: "github_search",
  description: "Search GitHub repositories using Exa AI - performs real-time searches on GitHub.com to find relevant repositories and GitHub accounts.",
  schema: {
    query: z.string().describe("Search query for GitHub repositories, or Github account, or code"),
    numResults: z.number().optional().describe("Number of search results to return (default: 5)")
  },
  handler: async ({ query, numResults }, extra) => {
    const requestId = `github_search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logger = createRequestLogger(requestId, 'github_search');

    logger.start(query);

    try {
      // Create a fresh axios instance for each request
      const axiosInstance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY || ''
        },
        timeout: 25000
      });

      // Prefix the query with "exa.ai GitHub:" to focus on GitHub results
      const githubQuery = query.toLowerCase().includes('github') ? query : `exa.ai GitHub: ${query}`;

      const searchRequest: ExaSearchRequest = {
        query: githubQuery,
        type: "auto",
        includeDomains: ["github.com"],
        numResults: numResults || API_CONFIG.DEFAULT_NUM_RESULTS,
        contents: {
          text: true,
          livecrawl: 'always'
        }
      };

      logger.log("Sending request to Exa API for GitHub search");

      const response = await axiosInstance.post<ExaSearchResponse>(
        API_CONFIG.ENDPOINTS.SEARCH,
        searchRequest,
        { timeout: 25000 }
      );

      logger.log("Received response from Exa API");

      if (!response.data || !response.data.results) {
        logger.log("Warning: Empty or invalid response from Exa API");
        return {
          content: [{
            type: "text" as const,
            text: "No GitHub results found. Please try a different query."
          }]
        };
      }

      logger.log(`Found ${response.data.results.length} GitHub results`);

      const result = {
        content: [{
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2)
        }]
      };

      logger.complete();
      return result;
    } catch (error) {
      logger.error(error);

      if (axios.isAxiosError(error)) {
        // Handle Axios errors specifically
        const statusCode = error.response?.status || 'unknown';
        const errorMessage = error.response?.data?.message || error.message;

        logger.log(`Axios error (${statusCode}): ${errorMessage}`);
        return {
          content: [{
            type: "text" as const,
            text: `GitHub search error (${statusCode}): ${errorMessage}`
          }],
          isError: true,
        };
      }

      // Handle generic errors
      return {
        content: [{
          type: "text" as const,
          text: `GitHub search error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  },
  enabled: false
};
```
