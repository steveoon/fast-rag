'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { VisualizationData } from './index';
import { getProxyImageUrl } from '@/hooks/message-content-adapter';
import Image from 'next/image';
import { memo } from 'react';

// 动态导入地图组件（避免SSR尝试访问window对象）
const MapVisualization = dynamic(
  () => import('./MapVisualization').then(mod => ({ default: memo(mod.default) })),
  {
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" />
        <span>正在加载地图组件...</span>
      </div>
    ),
    ssr: false,
  }
);

// 可视化渲染器组件属性
interface VisualizationRendererProps {
  visualization: VisualizationData;
}

/**
 * 可视化渲染器组件 - 根据数据类型渲染不同的可视化组件
 */
export default function VisualizationRenderer({ visualization }: VisualizationRendererProps) {
  if (!visualization || !visualization.type) {
    return null;
  }

  // 根据visualization.type渲染不同的可视化组件
  switch (visualization.type) {
    case 'map':
      return <MapVisualization data={visualization.data} />;
    case 'image':
      if (typeof visualization.data.url === 'string') {
        return (
          <div className="w-full overflow-hidden rounded-md">
            <Image
              src={getProxyImageUrl(visualization.data.url as string)}
              alt={(visualization.data.alt as string) || '可视化图像'}
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto rounded-md"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </div>
        );
      }
      return (
        <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md text-yellow-800 dark:text-yellow-200">
          <p>无效的图片数据</p>
        </div>
      );
    // 可以扩展其他类型的可视化
    // case 'chart':
    //   return <ChartVisualization data={visualization.data} />;
    default:
      console.warn(`未知的可视化类型: ${visualization.type}`);
      return (
        <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md text-yellow-800 dark:text-yellow-200">
          <p>不支持的可视化类型: {visualization.type}</p>
        </div>
      );
  }
}
