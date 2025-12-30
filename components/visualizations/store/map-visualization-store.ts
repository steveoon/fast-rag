import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  MapDataForVisualization,
  GeocodeVisualization,
  PlacesSearchVisualization,
} from '@/lib/utils/tools/tool-definitions/google-maps';
import { useRef, useEffect } from 'react';

// 类型定义部分
type MarkerType = {
  position: { lat: number; lng: number };
  title: string;
  description?: string;
  open?: boolean;
};

// 通用坐标类型
type Coordinates = { lat: number; lng: number };

// 扩展后的地图数据类型，使用联合类型处理不同数据结构
interface ExtendedMapData
  extends Partial<MapDataForVisualization & GeocodeVisualization & PlacesSearchVisualization> {
  result?: Record<string, unknown>;
  visualize?: {
    type: string;
    data: Record<string, unknown>;
  };
}

// 单个地图实例的状态
interface MapInstanceState {
  mapData: ExtendedMapData | null;
  markers: MarkerType[];
  mapCenter: Coordinates | null;
  mapZoom: number;
  directions: google.maps.DirectionsResult | null;
}

// 全局store类型
interface MapState {
  // 状态
  instances: Record<string, MapInstanceState>;
  currentInstanceId: string | null;

  // 实例管理方法
  createInstance: (instanceId?: string) => string;
  getInstance: (instanceId: string) => MapInstanceState;

  // 更新方法 (作用于特定实例)
  setMapData: (instanceId: string, data: Record<string, unknown>) => void;
  setMarkers: (instanceId: string, markers: MarkerType[]) => void;
  setMapCenter: (instanceId: string, center: Coordinates | null) => void;
  setMapZoom: (instanceId: string, zoom: number) => void;
  setDirections: (instanceId: string, directions: google.maps.DirectionsResult | null) => void;
  toggleMarkerOpen: (instanceId: string, index: number) => void;
  closeMarkerInfo: (instanceId: string, index: number) => void;

  // 处理数据方法
  processMapData: (instanceId: string, map: google.maps.Map | null) => void;
}

// 常量定义
const DEFAULT_CENTER: Coordinates = { lat: 39.9042, lng: 116.4074 }; // 北京
const DEFAULT_ZOOM = 12;

// 创建默认实例状态
const createDefaultInstanceState = (): MapInstanceState => ({
  mapData: null,
  markers: [],
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,
  directions: null,
});

// 检查实例是否存在，不存在则创建
const ensureInstanceExists = (get: () => MapState, instanceId: string) => {
  if (!get().instances[instanceId]) {
    get().createInstance(instanceId);
  }
};

// 主Store创建
export const useMapStore = create<MapState>((set, get) => ({
  // 初始状态
  instances: {},
  currentInstanceId: null,

  // 实例管理
  createInstance: instanceId => {
    const id = instanceId || nanoid();
    const { instances } = get();
    if (!instances[id]) {
      set(state => ({
        instances: {
          ...state.instances,
          [id]: createDefaultInstanceState(),
        },
        currentInstanceId: id,
      }));
    }
    return id;
  },

  getInstance: instanceId => {
    const { instances } = get();
    if (!instances[instanceId]) {
      get().createInstance(instanceId);
    }
    return instances[instanceId] || createDefaultInstanceState();
  },

  // 更新方法
  setMapData: (instanceId, data) => {
    ensureInstanceExists(get, instanceId);

    // 尝试从data或data.visualize.data中获取地图数据
    let mapData: ExtendedMapData = { ...data } as ExtendedMapData;

    // 安全地检查visualize属性
    if (
      data &&
      typeof data === 'object' &&
      'visualize' in data &&
      data.visualize &&
      typeof data.visualize === 'object' &&
      'data' in data.visualize &&
      data.visualize.data
    ) {
      mapData = {
        ...(data.visualize.data as Record<string, unknown>),
      } as ExtendedMapData;
    }

    set(state => ({
      instances: {
        ...state.instances,
        [instanceId]: {
          ...state.instances[instanceId],
          mapData,
        },
      },
    }));
  },

  setMarkers: (instanceId, markers) => {
    ensureInstanceExists(get, instanceId);

    set(state => ({
      instances: {
        ...state.instances,
        [instanceId]: {
          ...state.instances[instanceId],
          markers,
        },
      },
    }));
  },

  setMapCenter: (instanceId, center) => {
    ensureInstanceExists(get, instanceId);

    set(state => ({
      instances: {
        ...state.instances,
        [instanceId]: {
          ...state.instances[instanceId],
          mapCenter: center,
        },
      },
    }));
  },

  setMapZoom: (instanceId, zoom) => {
    ensureInstanceExists(get, instanceId);

    set(state => ({
      instances: {
        ...state.instances,
        [instanceId]: {
          ...state.instances[instanceId],
          mapZoom: zoom,
        },
      },
    }));
  },

  setDirections: (instanceId, directions) => {
    ensureInstanceExists(get, instanceId);

    set(state => ({
      instances: {
        ...state.instances,
        [instanceId]: {
          ...state.instances[instanceId],
          directions,
        },
      },
    }));
  },

  toggleMarkerOpen: (instanceId, index) => {
    ensureInstanceExists(get, instanceId);

    const instance = get().getInstance(instanceId);
    const newMarkers = [...instance.markers];
    if (index >= 0 && index < newMarkers.length) {
      newMarkers[index].open = !newMarkers[index].open;
      get().setMarkers(instanceId, newMarkers);
    }
  },

  closeMarkerInfo: (instanceId, index) => {
    ensureInstanceExists(get, instanceId);

    const instance = get().getInstance(instanceId);
    const newMarkers = [...instance.markers];
    if (index >= 0 && index < newMarkers.length) {
      newMarkers[index].open = false;
      get().setMarkers(instanceId, newMarkers);
    }
  },

  // 处理地图数据
  processMapData: (instanceId, map) => {
    ensureInstanceExists(get, instanceId);

    const instance = get().getInstance(instanceId);
    const mapData = instance.mapData;
    console.log('mapData-in-processMapData:', mapData);

    if (!mapData || !map) return;

    const operation = mapData.operation || '';
    switch (operation) {
      case 'geocode':
      case 'reverse_geocode':
      case 'place_details':
        handleGeocodeResult(instanceId, map, mapData);
        break;
      case 'search_places':
        handleSearchPlacesResult(instanceId, map, mapData);
        break;
      case 'directions':
        handleDirectionsResult(instanceId, map, mapData);
        break;
    }
  },
}));

// 数据处理工具函数

// 从locations数组创建标记
function createMarkersFromLocations(
  locations: Array<{
    place_id: string;
    formatted_address: string;
    location: Coordinates;
  }>,
  bounds: google.maps.LatLngBounds
): MarkerType[] {
  return locations.map((loc, index) => {
    const pos = {
      lat: loc.location.lat,
      lng: loc.location.lng,
    };

    bounds.extend(pos);

    return {
      position: pos,
      title: loc.formatted_address || `位置 ${index + 1}`,
      description: `坐标: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
      open: index === 0,
    };
  });
}

// 从places数组创建标记
function createMarkersFromPlaces(
  places: Array<{
    name: string;
    place_id: string;
    formatted_address: string;
    location: Coordinates;
    rating?: number;
    types?: string[];
  }>,
  bounds: google.maps.LatLngBounds
): MarkerType[] {
  return places.map((place, index) => {
    const position = {
      lat: place.location.lat,
      lng: place.location.lng,
    };

    bounds.extend(position);

    return {
      position,
      title: place.name || `地点 ${index + 1}`,
      description: place.formatted_address || '',
      open: index === 0,
    };
  });
}

// 处理位置数据 - 新数据结构
function processLocationsData(
  instanceId: string,
  map: google.maps.Map,
  locationsData: Array<{
    place_id: string;
    formatted_address: string;
    location: Coordinates;
  }>
): boolean {
  if (locationsData && Array.isArray(locationsData) && locationsData.length > 0) {
    const { setMarkers, setMapCenter, setMapZoom } = useMapStore.getState();
    const firstLocation = locationsData[0];
    const position = {
      lat: firstLocation.location.lat,
      lng: firstLocation.location.lng,
    };

    // 设置地图中心
    map.setCenter(position);
    setMapCenter(instanceId, position);
    setMapZoom(instanceId, 15);

    // 如果有多个位置，创建多个标记
    if (locationsData.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      const newMarkers = createMarkersFromLocations(locationsData, bounds);
      setMarkers(instanceId, newMarkers);

      // 调整地图以包含所有标记
      map.fitBounds(bounds);
    } else {
      // 单个位置
      setMarkers(instanceId, [
        {
          position,
          title: firstLocation.formatted_address || '搜索结果',
          description: `坐标: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
          open: true,
        },
      ]);
    }

    return true;
  }

  return false;
}

// 处理JSON内容中的位置数据 - 旧数据结构
function processLegacyContentLocation(
  instanceId: string,
  map: google.maps.Map,
  parsedContent: Record<string, unknown>
): boolean {
  const { setMarkers, setMapCenter, setMapZoom } = useMapStore.getState();

  // 如果有location属性，直接使用
  if (parsedContent.location && typeof parsedContent.location === 'object') {
    const location = parsedContent.location as { lat: number; lng: number };
    const position = {
      lat: location.lat,
      lng: location.lng,
    };

    // 设置地图中心
    map.setCenter(position);
    setMapCenter(instanceId, position);
    setMapZoom(instanceId, 15);

    // 添加标记
    setMarkers(instanceId, [
      {
        position,
        title: (parsedContent.formatted_address as string) || '搜索结果',
        description: `坐标: ${position.lat}, ${position.lng}`,
        open: true,
      },
    ]);

    return true;
  }

  return false;
}

// 处理places数据 - 新数据结构
function processPlacesData(
  instanceId: string,
  map: google.maps.Map,
  placesData: Array<{
    name: string;
    place_id: string;
    formatted_address: string;
    location: Coordinates;
    rating?: number;
    types?: string[];
  }>
): boolean {
  if (placesData && Array.isArray(placesData) && placesData.length > 0) {
    const { setMarkers } = useMapStore.getState();
    const bounds = new google.maps.LatLngBounds();
    const newMarkers = createMarkersFromPlaces(placesData, bounds);

    setMarkers(instanceId, newMarkers);

    // 调整地图以包含所有标记
    if (map && newMarkers.length > 0) {
      map.fitBounds(bounds);
      if (newMarkers.length === 1) {
        map.setZoom(15);
      }
    }

    return true;
  }

  return false;
}

// 处理JSON内容中的places数组 - 旧数据结构
function processLegacyContentPlaces(
  instanceId: string,
  map: google.maps.Map,
  parsedContent: Record<string, unknown>
): boolean {
  const { setMarkers } = useMapStore.getState();

  // 如果有places数组
  if (parsedContent.places && Array.isArray(parsedContent.places)) {
    const bounds = new google.maps.LatLngBounds();
    const newMarkers = parsedContent.places.map((place: Record<string, unknown>, index: number) => {
      const location = place.location as { lat: number; lng: number } | undefined;
      const position = {
        lat: location?.lat ?? 0,
        lng: location?.lng ?? 0,
      };

      bounds.extend(position);

      return {
        position,
        title: (place.name as string) || `地点 ${index + 1}`,
        description: (place.formatted_address as string) || '',
        open: index === 0,
      };
    });

    setMarkers(instanceId, newMarkers);

    // 调整地图以包含所有标记
    if (map && newMarkers.length > 0) {
      map.fitBounds(bounds);
      if (newMarkers.length === 1) {
        map.setZoom(15);
      }
    }

    return true;
  }

  return false;
}

// 解析内容数组中的JSON数据 - 通用处理旧数据结构
function tryParseLegacyContent(
  instanceId: string,
  map: google.maps.Map,
  result: Record<string, unknown>,
  processor: (
    instanceId: string,
    map: google.maps.Map,
    parsedContent: Record<string, unknown>
  ) => boolean
): boolean {
  if (result && Array.isArray(result.content) && result.content.length > 0) {
    // 解析JSON字符串
    const contentItem = result.content[0] as { type: string; text: string };
    if (contentItem.type === 'text' && contentItem.text) {
      try {
        const parsedContent = JSON.parse(contentItem.text);
        return processor(instanceId, map, parsedContent);
      } catch {
        // 解析错误，静默失败
      }
    }
  }

  return false;
}

// 辅助函数 - 处理地理编码结果
function handleGeocodeResult(instanceId: string, map: google.maps.Map, mapData: ExtendedMapData) {
  const { setMapCenter, setMapZoom } = useMapStore.getState();

  try {
    console.log('Geocode data:', mapData);

    // 首先，检查直接在mapData中的locations数组（提取后的数据结构）
    if (mapData?.locations && Array.isArray(mapData.locations) && mapData.locations.length > 0) {
      if (
        processLocationsData(
          instanceId,
          map,
          mapData.locations as Array<{
            place_id: string;
            formatted_address: string;
            location: Coordinates;
          }>
        )
      ) {
        return;
      }
    }

    // 然后再尝试从visualize.data中查找（原始嵌套结构，可能是备用逻辑）
    if (
      mapData?.visualize?.data &&
      typeof mapData.visualize.data === 'object' &&
      'locations' in mapData.visualize.data
    ) {
      if (
        processLocationsData(
          instanceId,
          map,
          mapData.visualize.data.locations as Array<{
            place_id: string;
            formatted_address: string;
            location: Coordinates;
          }>
        )
      ) {
        return;
      }
    }

    // 如果上面的处理失败，尝试原来的解析方法（向后兼容）
    // 检查是否有content数组（旧数据结构）
    const result = mapData.result || {};
    if (tryParseLegacyContent(instanceId, map, result, processLegacyContentLocation)) {
      return;
    }

    // 如果处理都失败，使用默认位置
    setMapCenter(instanceId, DEFAULT_CENTER);
    setMapZoom(instanceId, DEFAULT_ZOOM);
  } catch {
    // 错误处理，失败时回退到默认位置
    setMapCenter(instanceId, DEFAULT_CENTER);
    setMapZoom(instanceId, DEFAULT_ZOOM);
  }
}

// 辅助函数 - 处理地点搜索结果
function handleSearchPlacesResult(
  instanceId: string,
  map: google.maps.Map,
  mapData: ExtendedMapData
) {
  try {
    // 首先，检查visualize中的places数组格式
    if (
      mapData?.visualize?.data &&
      typeof mapData.visualize.data === 'object' &&
      'places' in mapData.visualize.data
    ) {
      if (
        processPlacesData(
          instanceId,
          map,
          mapData.visualize.data.places as Array<{
            name: string;
            place_id: string;
            formatted_address: string;
            location: Coordinates;
            rating?: number;
            types?: string[];
          }>
        )
      ) {
        return;
      }
    }

    // 现在尝试从mapData的根级别寻找places数组
    if ('places' in mapData) {
      if (
        processPlacesData(
          instanceId,
          map,
          mapData.places as Array<{
            name: string;
            place_id: string;
            formatted_address: string;
            location: Coordinates;
            rating?: number;
            types?: string[];
          }>
        )
      ) {
        return;
      }
    }

    // 如果上面的处理失败，尝试原来的解析方法（向后兼容）
    const result = mapData.result || {};
    tryParseLegacyContent(instanceId, map, result, processLegacyContentPlaces);
  } catch {
    // 错误处理，静默失败
  }
}

// 辅助函数 - 处理路线结果
function handleDirectionsResult(
  instanceId: string,
  map: google.maps.Map,
  mapData: ExtendedMapData
) {
  const { setMarkers, setDirections } = useMapStore.getState();

  try {
    // 确保routes数组存在且有效
    if (mapData?.routes && Array.isArray(mapData.routes) && mapData.routes.length > 0) {
      // 创建标记显示起点和终点
      const newMarkers: MarkerType[] = [];
      const bounds = new google.maps.LatLngBounds();

      // 处理所有legs
      mapData.routes.forEach((route, routeIndex) => {
        if (route.legs && Array.isArray(route.legs)) {
          route.legs.forEach((leg, legIndex) => {
            if (leg.start_location) {
              newMarkers.push({
                position: leg.start_location,
                title: `起点 ${routeIndex + 1}-${legIndex + 1}`,
                description: `距离: ${leg.distance?.text}, 时间: ${leg.duration?.text}`,
                open: false,
              });
              bounds.extend(leg.start_location);
            }

            if (leg.end_location) {
              newMarkers.push({
                position: leg.end_location,
                title: `终点 ${routeIndex + 1}-${legIndex + 1}`,
                description: `距离: ${leg.distance?.text}, 时间: ${leg.duration?.text}`,
                open: false,
              });
              bounds.extend(leg.end_location);
            }
          });
        }
      });

      // 设置标记
      setMarkers(instanceId, newMarkers);

      // 使用Google Maps DirectionsService API获取并显示路线
      if (
        mapData.routes.length > 0 &&
        mapData.routes[0].legs &&
        mapData.routes[0].legs.length > 0
      ) {
        const firstLeg = mapData.routes[0].legs[0];
        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
          {
            origin: new google.maps.LatLng(
              firstLeg.start_location.lat,
              firstLeg.start_location.lng
            ),
            destination: new google.maps.LatLng(
              firstLeg.end_location.lat,
              firstLeg.end_location.lng
            ),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              setDirections(instanceId, result);
            } else {
              // 如果API请求失败，至少调整地图以显示我们的标记
              if (map && bounds.isEmpty() === false) {
                map.fitBounds(bounds);
              }
            }
          }
        );
      } else {
        // 如果没有可用的路段数据，仅调整地图视图
        if (map && bounds.isEmpty() === false) {
          map.fitBounds(bounds);
        }
      }
    }
  } catch {
    // 错误处理，静默失败
  }
}

// 为特定实例创建hook
export function useMapInstance(instanceId?: string) {
  const storeApi = useMapStore();

  // 使用useRef保存生成的实例ID，在组件生命周期内保持稳定
  // 同步生成ID（不触发setState），但实际注册到store在effect中完成
  const generatedIdRef = useRef<string>(instanceId || nanoid());

  // 使用传入的ID或已生成的ID
  const id = instanceId || generatedIdRef.current;

  // 在effect中注册实例到store，避免在渲染阶段调用setState
  useEffect(() => {
    // 确保实例已在store中注册
    const { instances } = useMapStore.getState();
    if (!instances[id]) {
      storeApi.createInstance(id);
    }
  }, [id, storeApi]);

  // 从store获取实例数据，如果不存在则返回默认状态
  const instances = useMapStore(state => state.instances);
  const instance = instances[id] || createDefaultInstanceState();

  return {
    instanceId: id,
    mapData: instance.mapData,
    markers: instance.markers,
    mapCenter: instance.mapCenter,
    mapZoom: instance.mapZoom,
    directions: instance.directions,
    setMapData: (data: Record<string, unknown>) => storeApi.setMapData(id, data),
    setMarkers: (markers: MarkerType[]) => storeApi.setMarkers(id, markers),
    setMapCenter: (center: Coordinates | null) => storeApi.setMapCenter(id, center),
    setMapZoom: (zoom: number) => storeApi.setMapZoom(id, zoom),
    setDirections: (directions: google.maps.DirectionsResult | null) =>
      storeApi.setDirections(id, directions),
    toggleMarkerOpen: (index: number) => storeApi.toggleMarkerOpen(id, index),
    closeMarkerInfo: (index: number) => storeApi.closeMarkerInfo(id, index),
    processMapData: (map: google.maps.Map | null) => storeApi.processMapData(id, map),
  };
}
