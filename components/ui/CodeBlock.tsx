'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from 'next-themes';

export interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, fileName, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 语言映射，确保支持更多文件扩展名
  const getLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      java: 'java',
      php: 'php',
      rust: 'rust',
      cs: 'csharp',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
      graphql: 'graphql',
    };

    return langMap[lang] || lang;
  };

  return (
    <div className="relative bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* 文件名和语言标签 */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs">
        {fileName && (
          <span className="font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
        )}
        <div className="flex items-center">
          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono">
            {language}
          </span>
        </div>
      </div>

      {/* 代码内容 */}
      <div className="relative group">
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language={getLanguage(language)}
            style={isDark ? oneDark : oneLight}
            showLineNumbers={showLineNumbers}
            wrapLongLines={false}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
            }}
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1em',
              color: isDark ? '#606060' : '#a0aec0',
              textAlign: 'right',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {/* 复制按钮 */}
        <button
          onClick={handleCopy}
          type="button"
          className="absolute top-2 right-2 p-2 rounded-md bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
