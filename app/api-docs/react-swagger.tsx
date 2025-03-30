'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useTheme } from 'next-themes';
import { darkThemeCSS, lightThemeCSS } from './themes';

interface Props {
  spec: Record<string, unknown>;
}

// 为请求拦截器定义请求对象类型
interface SwaggerRequest {
  url: string;
  credentials?: RequestCredentials;
  loadSpec?: boolean;
  [key: string]: unknown;
}

export function ReactSwagger({ spec }: Props) {
  const { theme, resolvedTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [styleId] = useState(`swagger-custom-styles-${Math.random().toString(36).substring(2, 9)}`);

  // 计算当前是否为深色模式
  useEffect(() => {
    setMounted(true);
    // 使用 resolvedTheme 更准确地检测深色模式
    setIsDarkMode(
      resolvedTheme === 'dark' ||
        (resolvedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme, resolvedTheme]);

  // 应用主题样式
  useEffect(() => {
    if (!mounted) return;

    // 查找并移除旧样式元素
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
      oldStyle.remove();
    }

    // 创建新样式元素
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = isDarkMode ? darkThemeCSS : lightThemeCSS;
    document.head.appendChild(styleElement);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (resolvedTheme === 'system') {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isDarkMode, mounted, styleId, resolvedTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <SwaggerUI
      spec={spec}
      layout="BaseLayout"
      docExpansion="list"
      defaultModelsExpandDepth={-1}
      supportedSubmitMethods={[]}
      tryItOutEnabled={false}
      requestInterceptor={(req: SwaggerRequest) => {
        if (req.loadSpec) {
          return req;
        }
        req.credentials = 'include';
        return req;
      }}
    />
  );
}
