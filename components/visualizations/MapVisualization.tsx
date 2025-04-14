/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, memo, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  Libraries,
} from '@react-google-maps/api';
import { useMapInstance } from './store/map-visualization-store';

// 地图组件的默认中心坐标（北京）
const DEFAULT_CENTER = { lat: 39.9042, lng: 116.4074 };

// 地图容器样式
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// 地图选项
const mapOptions = {
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

// 定义Google Maps libraries作为常量，避免在每次渲染时创建新数组
const GOOGLE_MAPS_LIBRARIES: Libraries = ['places'];

interface MapVisualizationProps {
  data: Record<string, any>;
  instanceId?: string; // 可选的实例ID，如果不提供会自动生成
}

// 使用memo和instanceId包装地图渲染组件以减少不必要的重渲染
const MapRender = memo(function MapRender({ instanceId }: { instanceId: string }) {
  const { markers, mapCenter, mapZoom, directions, toggleMarkerOpen, closeMarkerInfo } =
    useMapInstance(instanceId);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter || DEFAULT_CENTER}
      zoom={mapZoom}
      options={mapOptions}
    >
      {/* 渲染所有标记和信息窗口 */}
      {markers.map((marker, index) => (
        <Marker
          key={`marker-${index}`}
          position={marker.position}
          title={marker.title}
          animation={google.maps.Animation.DROP}
          onClick={() => toggleMarkerOpen(index)}
        >
          {marker.open && (
            <InfoWindow position={marker.position} onCloseClick={() => closeMarkerInfo(index)}>
              <div className="p-1">
                <div className="font-semibold">{marker.title}</div>
                {marker.description && <div className="text-sm mt-1">{marker.description}</div>}
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: false,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: '#4285F4',
              strokeWeight: 5,
            },
          }}
        />
      )}
    </GoogleMap>
  );
});

export default function MapVisualization({ data, instanceId }: MapVisualizationProps) {
  // 保存google maps实例的引用
  const mapRef = useRef<google.maps.Map | null>(null);

  // 保存数据更新标志
  const dataRef = useRef(data);

  // 获取此组件实例的map store
  const mapInstance = useMapInstance(instanceId);
  const { instanceId: storeInstanceId } = mapInstance;

  // 使用useCallback包装方法，使其在组件生命周期内保持不变
  const setMapData = useCallback(
    (data: Record<string, any>) => {
      mapInstance.setMapData(data);
    },
    [storeInstanceId]
  ); // 仅依赖于storeInstanceId

  const processMapData = useCallback(
    (map: google.maps.Map | null) => {
      mapInstance.processMapData(map);
    },
    [storeInstanceId]
  ); // 仅依赖于storeInstanceId

  // 在控制台记录实例ID，方便调试
  const componentId = useMemo(() => `map-${storeInstanceId}`, [storeInstanceId]);

  // 使用Google Maps JS API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // 处理数据并初始化地图状态 - 当数据发生变化时
  useEffect(() => {
    console.log(`[${componentId}] 数据更新:`, data);
    dataRef.current = data;
    setMapData(data);

    // 如果地图已经加载，数据变化时也需要处理
    if (mapRef.current) {
      console.log(`[${componentId}] 地图已加载，处理新数据`);
      processMapData(mapRef.current);
    }
  }, [data, componentId, setMapData, processMapData]);

  // 地图加载完成回调
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      console.log(`[${componentId}] 地图加载完成`);
      mapRef.current = map;
      processMapData(map);
    },
    [processMapData, componentId]
  );

  // 渲染加载错误
  if (loadError) {
    return (
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-[300px] flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-red-500">
            <p>加载地图时出错:</p>
            <p>{loadError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 渲染加载中状态
  if (!isLoaded) {
    return (
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-[300px] items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" />
            <span>正在加载地图...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 渲染地图
  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          onLoad={handleMapLoad}
        >
          <MapRender instanceId={storeInstanceId} />
        </GoogleMap>
      </CardContent>
    </Card>
  );
}
