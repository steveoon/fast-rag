// Google Maps API类型声明
declare global {
  interface Window {
    google: {
      maps: {
        Map: typeof google.maps.Map;
        Marker: typeof google.maps.Marker;
        InfoWindow: typeof google.maps.InfoWindow;
        LatLng: typeof google.maps.LatLng;
        LatLngBounds: typeof google.maps.LatLngBounds;
        DirectionsRenderer: typeof google.maps.DirectionsRenderer;
        Animation: typeof google.maps.Animation;
      };
    };
  }
}

// 确保此文件被视为模块
export {};
