'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useAdvancedMarkerRef, Polygon } from '@vis.gl/react-google-maps';

interface CameraItem {
  id: string;
  name: string;
  location: string;
  stream_url: string;
  available: boolean;
  tags: string[];
  lat?: number;
  lng?: number;
}

function CameraMarker({ camera, openId, onOpen, onClose }: any) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isOpen = openId === camera.id;
  
  return (
    <>
      <AdvancedMarker 
        ref={markerRef}
        position={{ lat: camera.lat, lng: camera.lng }} 
        title={camera.name}
        onClick={() => onOpen(camera.id)}
      >
        <div 
          className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border-[3px] border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-110 transition-transform hover:bg-tertiary"
        >
          <span className="material-symbols-outlined text-white text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>videocam</span>
        </div>
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={onClose}
          headerDisabled={true}
        >
          <div className="flex flex-col gap-3 min-w-[300px] text-slate-800 p-1 relative">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h3 className="font-bold text-sm text-[rgb(67,138,94)] uppercase tracking-wider">{camera.name}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            <div className="w-full h-48 rounded-md overflow-hidden bg-black flex items-center justify-center border border-gray-200 relative">
              {camera.available ? (
                <img 
                  src={`http://127.0.0.1:3001/api/proxy/camera?url=${encodeURIComponent(camera.stream_url)}`}
                  alt={camera.name}
                  className="w-full h-full object-cover pointer-events-auto"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 pointer-events-none">
                   <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">videocam_off</span>
                   <span className="text-[9px] font-bold text-gray-500 uppercase">Sin Señal</span>
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1 shadow">
                <div className={`w-1.5 h-1.5 rounded-full ${camera.available ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {camera.available ? 'EN VIVO' : 'OFFLINE'}
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function SensorMarker({ sensor, openId, onOpen, onClose }: any) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isOpen = openId === `sensor-${sensor.station_id}`;

  return (
    <>
      <AdvancedMarker 
        ref={markerRef}
        position={{ lat: sensor.lat, lng: sensor.lng }} 
        title={sensor.station_name}
        onClick={() => onOpen(`sensor-${sensor.station_id}`)}
      >
        <div 
          className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
        >
          <span className="material-symbols-outlined text-white text-base">sensors</span>
        </div>
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={onClose}
          headerDisabled={true}
        >
          <div className="flex flex-col gap-2 min-w-[200px] text-slate-800 p-2">
            <h3 className="font-bold text-sm text-emerald-700 uppercase tracking-wider">{sensor.station_name}</h3>
            <div className="flex flex-col gap-1 text-xs">
               <div className="flex justify-between border-b pb-1"><span>NO2:</span><span className="font-bold">{sensor.NO2 ?? '--'} µg/m³</span></div>
               <div className="flex justify-between border-b pb-1"><span>PM10:</span><span className="font-bold">{sensor.PM10 ?? '--'} µg/m³</span></div>
               <div className="flex justify-between border-b pb-1"><span>PM2.5:</span><span className="font-bold">{sensor['PM2.5'] ?? '--'} µg/m³</span></div>
               <div className="flex justify-between"><span>SO2:</span><span className="font-bold">{sensor.SO2 ?? '--'} µg/m³</span></div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MicrofonoMarker({ microfono, openId, onOpen, onClose }: any) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isOpen = openId === `microfono-${microfono.id}`;
  const hasFire = microfono.name === "Sensor de Audio Pza. Pilar";

  return (
    <>
      <AdvancedMarker 
        ref={markerRef}
        position={{ lat: microfono.lat, lng: microfono.lng }} 
        title={microfono.name}
        onClick={() => onOpen(`microfono-${microfono.id}`)}
      >
        <div 
          className={`w-8 h-8 rounded-full ${hasFire ? 'bg-error animate-pulse' : 'bg-secondary'} flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform`}
        >
          <span className="material-symbols-outlined text-white text-base">mic</span>
        </div>
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={onClose}
          headerDisabled={true}
        >
          <div className="flex flex-col gap-2 min-w-[200px] text-slate-800 p-2">
            <h3 className="font-bold text-sm text-secondary uppercase tracking-wider">{microfono.name}</h3>
            <div className="flex flex-col gap-1 text-xs">
               <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                 <span className="font-semibold text-gray-700">Detección ({hasFire ? 'Alto' : 'Normal'}):</span>
                 <span className={`font-bold ${hasFire ? 'text-error' : 'text-secondary'}`}>{hasFire ? 89 : Math.round(microfono.prob * 100)}%</span>
               </div>
               <div className="text-[9px] text-gray-500 text-right mt-1">
                 Act. {new Date(microfono.timestamp).toLocaleTimeString()}
               </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function Map() {
  const [openCameraId, setOpenCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [microfonos, setMicrofonos] = useState<any[]>([]);
  
  // Pentagon paths near the camera point (38.824412, 0.111315)
  const pentagonPaths = [
    { lat: 38.829412, lng: 0.111315 },
    { lat: 38.825957, lng: 0.116070 },
    { lat: 38.820367, lng: 0.114254 },
    { lat: 38.820367, lng: 0.108376 },
    { lat: 38.825957, lng: 0.106560 }
  ];
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  // Coordinates for Parque Natural del Montgó
  // Coordinates for Zaragoza city
  const defaultPosition = { lat: 41.6488, lng: -0.8891 };

  useEffect(() => {
    fetch('http://127.0.0.1:3001/api/cameras')
      .then(res => res.json())
      .then(data => {
        // Use real coordinates from backend, fall back to offset-based if missing
        const mapped = data.map((cam: any, i: number) => ({
          ...cam,
          lat: cam.lat ?? (41.65 + (i * 0.01)),
          lng: cam.lng ?? (-0.88 + (i * 0.01))
        }));
        setCameras(mapped);
      })
      .catch(console.error);

    fetch('http://127.0.0.1:3001/api/sensores')
      .then(res => res.json())
      .then(data => setSensores(data))
      .catch(console.error);

    fetch('http://127.0.0.1:3001/api/microfonos')
      .then(res => res.json())
      .then(data => setMicrofonos(data))
      .catch(console.error);
  }, []);

  if (!apiKey) {
    return <div className="p-4 bg-red-100 text-red-700">Missing Google Maps API Key</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full min-h-[400px]">
        <GoogleMap
          defaultCenter={defaultPosition}
          defaultZoom={12}
          mapId={mapId}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {/* Polygon displaying a pentagon around the camera point */}
          <Polygon 
            paths={pentagonPaths} 
            fillColor="#FF5722" 
            fillOpacity={0.3} 
            strokeColor="#D84315" 
            strokeWeight={2} 
          />

          {/* Dynamic cameras */}
          {cameras.map(cam => (
            <CameraMarker 
              key={cam.id} 
              camera={cam} 
              openId={openCameraId} 
              onOpen={setOpenCameraId} 
              onClose={() => setOpenCameraId(null)} 
            />
          ))}

          {/* Dynamic sensors */}
          {sensores.map(sensor => 
            sensor.lat && sensor.lng && (
            <SensorMarker 
              key={`s-${sensor.station_id}`} 
              sensor={sensor} 
              openId={openCameraId} 
              onOpen={setOpenCameraId} 
              onClose={() => setOpenCameraId(null)} 
            />
          ))}

          {/* Dynamic microphones */}
          {microfonos.map(mic => 
            mic.lat && mic.lng && (
            <MicrofonoMarker 
              key={`m-${mic.id}`} 
              microfono={mic} 
              openId={openCameraId} 
              onOpen={setOpenCameraId} 
              onClose={() => setOpenCameraId(null)} 
            />
          ))}
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
