// 可视化数据类型
import { z } from 'zod';

export const VisualizationDataSchema = z.object({
  type: z.enum(['map', 'image']),
  data: z.record(z.string(), z.unknown()),
});

export type VisualizationData = z.infer<typeof VisualizationDataSchema>;

// 地图数据类型
export interface MapData {
  operation: 'geocode' | 'reverse_geocode' | 'search_places' | 'place_details' | 'directions';
  result: Record<string, unknown>;
  query: string;
}

// 重新导出组件
export { default as MapVisualization } from './MapVisualization';
export { default as VisualizationRenderer } from './VisualizationRenderer';
