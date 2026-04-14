"use client";

import Map from "@/components/Map";
import LocalCamera from "@/components/LocalCamera";
import LocalMicrophone from "@/components/LocalMicrophone";
import Odometer from "@/components/Odometer";
import Skeleton from "@/components/Skeleton";
import { useState, useEffect } from "react";

interface Alert {
  id: number;
  title: string;
  message: string;
}

const INITIAL_ALERTS: Alert[] = [
  {
    id: 1,
    title: "ALERTAS ACTIVAS",
    message: "FUEGO DETECTADO - Sector Norte (Montgó Alpha). Protocolo de respuesta nivel 2 iniciado.",
  },
  {
    id: 2,
    title: "ALERTA SECUNDARIA",
    message: "TEMPERATURA ANÓMALA - Sector Este (Pico Segura). Monitoreo continuo activado.",
  },
  {
    id: 3,
    title: "AVISO PREVENTIVO",
    message: "VIENTO FUERTE - Valle Central. Riesgo de propagación elevado.",
  },
];

const MAX_ALERTS = 3;
const STACK_OFFSET_PX = 7;
const STACK_SCALE_STEP = 0.03;



export default function Dashboard() {
  const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [microfonos, setMicrofonos] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [dismissingIds, setDismissingIds] = useState<Set<number>>(new Set());
  const [visibleCamerasCount, setVisibleCamerasCount] = useState(6);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('http://127.0.0.1:3001/api/cameras')
      .then(res => res.json())
      .then(data => setCameras(data))
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

  const dismissAlert = (id: number) => {
    setDismissingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 380);
  };

  const handleCameraScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Load more when we are 50px from the bottom
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (visibleCamerasCount < cameras.length) {
        setVisibleCamerasCount(prev => prev + 20);
      }
    }
  };

  const visibleAlerts = alerts.slice(0, MAX_ALERTS);
  // Container height = front card height + peeking strip per extra card
  const stackContainerHeight =
    visibleAlerts.length > 0
      ? 80 + (visibleAlerts.length - 1) * STACK_OFFSET_PX
      : 0;

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 ${sidebarCollapsed ? 'w-14' : 'w-52'} bg-white dark:bg-slate-950 flex flex-col h-full py-3 border-r border-outline-variant z-50 transition-all duration-300`}>
        <div className={`px-2 mb-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-base font-black text-secondary font-headline uppercase tracking-tighter">Firebuster</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mt-0.5">Vigilancia Activa</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-lg">{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}</span>
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-1">
          <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-[5px] bg-surface-container text-secondary border-r-4 border-secondary font-bold transition-colors`} href="#" title="Resumen">
            <span className="material-symbols-outlined text-xl">dashboard</span>
            {!sidebarCollapsed && <span className="text-sm tracking-wide">Resumen</span>}
          </a>
          <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-[5px] text-on-surface-variant hover:bg-surface-container transition-colors`} href="#" title="Sensores">
            <span className="material-symbols-outlined text-xl">sensors</span>
            {!sidebarCollapsed && <span className="text-sm tracking-wide">Sensores</span>}
          </a>
          <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-[5px] text-on-surface-variant hover:bg-surface-container transition-colors`} href="#" title="Cámaras">
            <span className="material-symbols-outlined text-xl">videocam</span>
            {!sidebarCollapsed && <span className="text-sm tracking-wide">Cámaras</span>}
          </a>
          <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-[5px] text-on-surface-variant hover:bg-surface-container transition-colors`} href="#" title="Clima">
            <span className="material-symbols-outlined text-xl">thermostat</span>
            {!sidebarCollapsed && <span className="text-sm tracking-wide">Clima</span>}
          </a>
          <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-[5px] text-on-surface-variant hover:bg-surface-container transition-colors`} href="#" title="Alertas">
            <span className="material-symbols-outlined text-xl">warning</span>
            {!sidebarCollapsed && <span className="text-sm tracking-wide">Alertas</span>}
          </a>
        </nav>
        <div className="px-1 mt-auto">
          <div className="mt-3 pt-3 border-t border-outline-variant space-y-0.5">
            <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-1 text-on-surface-variant hover:bg-surface-container transition-all rounded-lg`} href="#" title="Soporte">
              <span className="material-symbols-outlined text-xl">help</span>
              {!sidebarCollapsed && <span className="text-xs">Soporte</span>}
            </a>
            <a className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-1.5'} py-1 text-on-surface-variant hover:bg-surface-container transition-all rounded-lg`} href="#" title="Registros">
              <span className="material-symbols-outlined text-xl">history</span>
              {!sidebarCollapsed && <span className="text-xs">Registros</span>}
            </a>
          </div>
        </div>
      </aside>
      <div className={`${sidebarCollapsed ? 'pl-14' : 'pl-52'} flex flex-col min-h-screen transition-all duration-300`}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-outline-variant shadow-sm flex justify-between items-center w-full px-4 py-2 antialiased">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-secondary">FIREBUSTER</h2>
            <div className="hidden md:flex items-center gap-3">
              <a className="text-secondary font-semibold border-b-2 border-secondary pb-0.5 text-sm" href="#">Panel de Control</a>
              <a className="text-on-surface-variant hover:text-secondary transition-colors text-sm" href="#">Vista de Mapa</a>
              <a className="text-on-surface-variant hover:text-secondary transition-colors text-sm" href="#">Analíticas</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-1.5 py-[3px] bg-surface-container rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-tertiary text-lg">light_mode</span>
              <span className="text-sm font-medium">24°C, Soleado</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-surface-container rounded-lg relative">
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
              </button>
              <button className="p-1 hover:bg-surface-container rounded-lg">
                <span className="material-symbols-outlined text-on-surface-variant">settings</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Central Metrics Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Active Alerts Section — stacked cards */}
            {visibleAlerts.length > 0 && (
              <div
                className="relative mb-4"
                style={{ height: `${stackContainerHeight}px` }}
              >
                {/* Render back-to-front so front card is last in DOM (highest natural z) */}
                {[...visibleAlerts].reverse().map((alert, reversedIdx) => {
                  const stackIdx = visibleAlerts.length - 1 - reversedIdx; // 0 = front
                  const isDismissing = dismissingIds.has(alert.id);
                  const isFront = stackIdx === 0;
                  const scale = 1 - stackIdx * STACK_SCALE_STEP;
                  const translateY = stackIdx * STACK_OFFSET_PX;
                  const opacity = 1 - stackIdx * 0.14;

                  return (
                    <div
                      key={alert.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: isDismissing
                          ? "translateY(-28px) scale(0.94)"
                          : `translateY(${translateY}px) scale(${scale})`,
                        opacity: isDismissing ? 0 : opacity,
                        zIndex: 30 - stackIdx * 10,
                        transformOrigin: "top center",
                        transition:
                          "transform 0.40s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease",
                        pointerEvents: isFront ? "auto" : "none",
                      }}
                    >
                      <div className="p-3 bg-error-container rounded-2xl border border-error/20 shadow-lg shadow-error/5">
                        <div className="flex items-center gap-3">
                          <span
                            className="material-symbols-outlined text-error text-3xl flex-shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            warning
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-headline font-extrabold text-error tracking-tight text-xl leading-tight">
                              {alert.title}
                            </h3>
                            <p className="text-sm text-on-error-container font-semibold mt-0.5 leading-snug">
                              {alert.message}
                            </p>
                          </div>
                          {isFront && (
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <button
                                id="alert-navigate-btn"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold shadow-md hover:bg-error/90 active:scale-95 transition-all"
                                onClick={() => { }}
                              >
                                <span
                                  className="material-symbols-outlined text-base"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  navigation
                                </span>
                                Llévame allí
                              </button>
                              <button
                                id="alert-dismiss-btn"
                                className="p-1.5 rounded-lg text-error hover:bg-error/10 active:scale-95 transition-all"
                                onClick={() => dismissAlert(alert.id)}
                                title="Cerrar alerta"
                              >
                                <span className="material-symbols-outlined text-xl">close</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Badge: remaining alert count (only on front card when stack has multiple) */}
                      {isFront && alerts.length > 1 && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-error rounded-full flex items-center justify-center text-white text-[10px] font-black z-50 shadow-md">
                          {alerts.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mb-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Métricas Actuales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {sensores.length === 0 ? (
                  <>
                    <Skeleton variant="metric" />
                    <Skeleton variant="metric" />
                    <Skeleton variant="metric" />
                    <Skeleton variant="metric" />
                    <Skeleton variant="metric" />
                  </>
                ) : (
                  <>
                    <div className="bg-surface-container-lowest p-3 rounded-2xl shadow-sm flex items-center justify-between border border-outline-variant">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                          <span className="material-symbols-outlined text-2xl">thermostat</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase">Temperatura</p>
                          <p className="text-3xl font-headline font-bold text-on-surface">24.5°C</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-3xl">trending_up</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-secondary text-lg">water_drop</span>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Humedad</p>
                      </div>
                      <p className="text-2xl font-headline font-bold text-secondary">32%</p>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-tertiary text-lg">air</span>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Viento</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-headline font-bold text-tertiary">18<span className="text-sm font-medium ml-1">km/h</span></p>
                        <div className="w-10 h-10 rounded-full border-2 border-outline-variant flex items-center justify-center relative bg-surface-container-lowest">
                          <span className="absolute top-[2px] text-[7px] leading-none font-bold text-on-surface-variant">N</span>
                          <span className="absolute bottom-[2px] text-[7px] leading-none font-bold text-on-surface-variant">S</span>
                          <span className="absolute right-[3px] text-[7px] leading-none font-bold text-on-surface-variant">E</span>
                          <span className="absolute left-[3px] text-[7px] leading-none font-bold text-on-surface-variant">O</span>
                          <span className="material-symbols-outlined text-tertiary text-base -rotate-90 z-10" style={{ fontVariationSettings: "'FILL' 1" }}>navigation</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-on-surface text-lg">compress</span>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Presión</p>
                      </div>
                      <p className="text-2xl font-headline font-bold text-on-surface">1012<span className="text-sm font-medium text-on-surface-variant ml-1">hPa</span></p>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-primary text-lg">eco</span>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Calidad del Aire</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-2xl font-headline font-bold text-primary">42</p>
                        <span className="px-1 py-[1px] bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded-full">BUENA</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="relative mb-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Cámaras */}
                <div className="space-y-3 flex flex-col">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant shrink-0">Cámaras</h3>
                  <div
                    onScroll={handleCameraScroll}
                    className={`transition-all duration-700 ease-in-out pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/50 hover:[&::-webkit-scrollbar-thumb]:bg-outline-variant [&::-webkit-scrollbar-thumb]:rounded-full ${isExpanded ? 'max-h-[460px] overflow-y-auto' : 'max-h-[190px] overflow-hidden'}`}
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      <LocalCamera />
                      {cameras.length === 0 ? (
                        <>
                          <Skeleton variant="card" />
                          <Skeleton variant="card" />
                          <Skeleton variant="card" />
                          <Skeleton variant="card" />
                        </>
                      ) : (
                        cameras.slice(0, visibleCamerasCount).map((cam, idx) => (
                          <div
                            key={cam.id}
                            className={`relative group rounded-xl overflow-hidden aspect-video ${idx === 0 ? "border-2 border-primary" : "shadow-md border border-outline-variant"} shadow-md cursor-pointer transition-transform hover:scale-[1.02]`}
                            onClick={() => setSelectedCamera(cam)}
                          >
                            {(cam.available && !failedImages.has(cam.id)) ? (
                              <img
                                alt={cam.name}
                                className="w-full h-full object-cover pointer-events-auto transition-opacity duration-300"
                                src={`http://127.0.0.1:3001/api/proxy/camera?url=${encodeURIComponent(cam.stream_url)}`}
                                loading="lazy"
                                onError={() => setFailedImages(prev => new Set(prev).add(cam.id))}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-surface-variant/30 pointer-events-none">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">videocam_off</span>
                                <span className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">No Disponible</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-transparent pointer-events-none"></div>
                            <div className="absolute top-2 left-2 flex items-center gap-[3px] px-[3px] py-[1px] bg-black/50 backdrop-blur-md rounded-full pointer-events-none">
                              <div className={`w-1.5 h-1.5 rounded-full ${cam.available ? 'bg-secondary animate-pulse' : 'bg-gray-500'}`}></div>
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{cam.available ? 'Live' : 'Offline'}</span>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-1.5 rounded pointer-events-none">
                              <p className="text-xs font-bold text-white leading-tight">{cam.name}</p>
                              <p className="text-[10px] text-white/80">{cam.tags && cam.tags.join(', ')}</p>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/30 backdrop-blur-sm rounded-lg p-1 group-hover:bg-black/50 transition-colors">
                              <Odometer prob={Math.round((cam.lat % 1) * 20)} size="sm" className="text-white" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Micrófonos */}
                <div className="space-y-3 flex flex-col">
                  <div className="flex justify-between items-center shrink-0">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Micrófonos</h3>
                    <span className="px-1 py-[1px] bg-secondary text-on-secondary text-[10px] font-bold rounded-full">EN LÍNEA</span>
                  </div>
                  <div className={`transition-all duration-700 ease-in-out pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/50 hover:[&::-webkit-scrollbar-thumb]:bg-outline-variant [&::-webkit-scrollbar-thumb]:rounded-full ${isExpanded ? 'max-h-[460px] overflow-y-auto' : 'max-h-[190px] overflow-hidden'}`}>
                    <div className="space-y-1.5">
                      <LocalMicrophone />
                      {microfonos.length === 0 ? (
                        <>
                          <Skeleton variant="text" className="h-10" />
                          <Skeleton variant="text" className="h-10" />
                          <Skeleton variant="text" className="h-10" />
                        </>
                      ) : (
                        microfonos.map(mic => {
                          const hasFire = mic.name === "Sensor de Audio Pza. Pilar";
                          return (
                            <div key={mic.id} className={`bg-surface-container-lowest p-2 rounded-xl shadow-sm flex items-center justify-between border ${hasFire ? 'border-error/50' : 'border-outline-variant'}`}>
                              <div className="flex items-center gap-1.5">
                                <span className={`material-symbols-outlined text-lg ${hasFire ? 'text-error animate-pulse' : 'text-secondary'}`} style={hasFire ? { fontVariationSettings: "'FILL' 1" } : {}}>mic</span>
                                <div className="flex flex-col justify-center">
                                  {hasFire && <span className="text-[10px] font-bold text-error uppercase leading-tight">Fuego Detectado</span>}
                                  <span className={`text-base font-medium leading-tight ${hasFire ? 'text-error' : ''}`}>{mic.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-end">
                                <Odometer prob={hasFire ? 89 : Math.round(mic.prob * 100)} className={hasFire ? 'text-error' : 'text-on-surface-variant'} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                {/* Sensores IoT */}
                <div className="space-y-3 flex flex-col">
                  <div className="flex justify-between items-center shrink-0">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Sensores IoT</h3>
                    <span className="px-1 py-[1px] bg-secondary text-on-secondary text-[10px] font-bold rounded-full">OPERATIVO</span>
                  </div>
                  <div className={`transition-all duration-700 ease-in-out pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/50 hover:[&::-webkit-scrollbar-thumb]:bg-outline-variant [&::-webkit-scrollbar-thumb]:rounded-full ${isExpanded ? 'max-h-[460px] overflow-y-auto' : 'max-h-[190px] overflow-hidden'}`}>
                    <div className="space-y-1.5">
                      {sensores.length === 0 ? (
                        <>
                          <Skeleton variant="text" className="h-16" />
                          <Skeleton variant="text" className="h-16" />
                          <Skeleton variant="text" className="h-16" />
                        </>
                      ) : (
                        sensores.map(sensor => {
                          const probVal = Math.round(((sensor.lat || 0) % 1) * 35) + 5;
                          return (
                            <div key={sensor.station_id} className="bg-surface-container-lowest p-1.5 rounded-xl shadow-sm border border-outline-variant flex gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1">
                                    <span className={`material-symbols-outlined text-base ${sensor.timestamp ? 'text-secondary' : 'text-on-surface-variant'}`}>sensors</span>
                                    <span className="text-sm font-bold uppercase tracking-wider truncate">{sensor.station_name}</span>
                                  </div>
                                  <div className="flex items-center gap-[3px]">
                                    {sensor.timestamp ? (
                                      <>
                                        <span className="px-[3px] py-[1px] bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded-sm">OPERATIVO</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="px-[3px] py-[1px] bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded-sm border border-dashed border-outline-variant/50">OFFLINE</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-[3px] pl-0.5">
                                  <div className={`px-1 py-[1px] rounded min-w-[80px] flex justify-between items-baseline gap-1 ${sensor.SO2 !== '--' && sensor.SO2 !== null ? 'bg-surface-container border border-outline-variant/30' : 'bg-surface-variant/30 border border-dashed border-outline-variant/50'}`}>
                                    <span className={`text-[11px] font-medium ${sensor.SO2 !== '--' && sensor.SO2 !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/60'}`}>SO<span className="text-[9px]">2</span></span>
                                    <span className={`text-[13px] font-bold ${sensor.SO2 !== '--' && sensor.SO2 !== null ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>{sensor.SO2 ?? '--'}<span className={`font-normal text-[9px] ml-[2px] ${sensor.SO2 !== '--' && sensor.SO2 !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>µg/m³</span></span>
                                  </div>
                                  <div className={`px-1 py-[1px] rounded min-w-[80px] flex justify-between items-baseline gap-1 ${sensor.NO2 !== '--' && sensor.NO2 !== null ? 'bg-surface-container border border-outline-variant/30' : 'bg-surface-variant/30 border border-dashed border-outline-variant/50'}`}>
                                    <span className={`text-[11px] font-medium ${sensor.NO2 !== '--' && sensor.NO2 !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/60'}`}>NO<span className="text-[9px]">2</span></span>
                                    <span className={`text-[13px] font-bold ${sensor.NO2 !== '--' && sensor.NO2 !== null ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>{sensor.NO2 ?? '--'}<span className={`font-normal text-[9px] ml-[2px] ${sensor.NO2 !== '--' && sensor.NO2 !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>µg/m³</span></span>
                                  </div>
                                  <div className={`px-1 py-[1px] rounded min-w-[80px] flex justify-between items-baseline gap-1 ${sensor.PM10 !== '--' && sensor.PM10 !== null ? 'bg-surface-container border border-outline-variant/30' : 'bg-surface-variant/30 border border-dashed border-outline-variant/50'}`}>
                                    <span className={`text-[11px] font-medium ${sensor.PM10 !== '--' && sensor.PM10 !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/60'}`}>PM<span className="text-[9px]">10</span></span>
                                    <span className={`text-[13px] font-bold ${sensor.PM10 !== '--' && sensor.PM10 !== null ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>{sensor.PM10 ?? '--'}<span className={`font-normal text-[9px] ml-[2px] ${sensor.PM10 !== '--' && sensor.PM10 !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>µg/m³</span></span>
                                  </div>
                                  <div className={`px-1 py-[1px] rounded min-w-[80px] flex justify-between items-baseline gap-1 ${sensor['PM2.5'] !== '--' && sensor['PM2.5'] !== null ? 'bg-surface-container border border-outline-variant/30' : 'bg-surface-variant/30 border border-dashed border-outline-variant/50'}`}>
                                    <span className={`text-[11px] font-medium ${sensor['PM2.5'] !== '--' && sensor['PM2.5'] !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/60'}`}>PM<span className="text-[9px]">2.5</span></span>
                                    <span className={`text-[13px] font-bold ${sensor['PM2.5'] !== '--' && sensor['PM2.5'] !== null ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>{sensor['PM2.5'] ?? '--'}<span className={`font-normal text-[9px] ml-[2px] ${sensor['PM2.5'] !== '--' && sensor['PM2.5'] !== null ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>µg/m³</span></span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-center border-l border-outline-variant/30 pl-1.5 shrink-0">
                                <Odometer prob={probVal} className="text-on-surface-variant" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Gradient transparent overlay */}
              <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-500 pointer-events-none ${isExpanded ? 'opacity-0' : 'opacity-100'} h-32 bg-gradient-to-t from-[#F7FBE1] dark:from-slate-950 via-[#F7FBE1]/80 dark:via-slate-950/80 to-transparent`}></div>
            </div>

            {/* Show More / Shrink Button */}
            <div className="flex justify-center -mt-7 relative z-10 w-full mb-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-[5px] bg-secondary text-on-secondary rounded-full font-bold shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:shadow-secondary/30 transition-all flex items-center gap-1 active:scale-95"
              >
                <span>{isExpanded ? "Mostrar Menos" : "Mostrar Más"}</span>
                <span className="material-symbols-outlined text-lg">{isExpanded ? "expand_less" : "expand_more"}</span>
              </button>
            </div>
          </div>
          {/* Foundation Map Panel (Bottom) */}
          <section className="h-[400px] relative border-t border-outline-variant bg-surface-container">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Map />
              <div className="absolute inset-0 heatmap-glow opacity-50 pointer-events-none"></div>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
              <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-outline-variant">
                <button className="p-[5px] hover:bg-surface-container transition-colors border-b border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant">add</span>
                </button>
                <button className="p-[5px] hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">remove</span>
                </button>
              </div>
              <button className="p-[5px] bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-outline-variant hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">layers</span>
              </button>
            </div>
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setMapFullscreen(true)}
                className="p-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-outline-variant hover:bg-surface-container transition-colors"
                title="Pantalla completa"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">fullscreen</span>
              </button>
              <div className="bg-white/80 backdrop-blur-md px-1.5 py-[3px] rounded-full shadow-sm border border-outline-variant text-[10px] font-bold uppercase tracking-widest text-secondary">
                BASE SIG INTERACTIVA
              </div>
            </div>
          </section>

          {/* Map Fullscreen Modal */}
          {mapFullscreen && (
            <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-md border-b border-white/10">
                <span className="text-white font-bold text-sm uppercase tracking-widest">Mapa — Vista Completa</span>
                <button
                  onClick={() => setMapFullscreen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <span className="material-symbols-outlined">fullscreen_exit</span>
                </button>
              </div>
              <div className="flex-1 relative">
                <Map />
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedCamera && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedCamera(null)}
        >
          <div
            className={`relative w-[90%] max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl ${selectedCamera.isPrimary ? "border-[3px] border-primary" : "border-2 border-outline-variant"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedCamera.stream_url ? (
              <img alt={selectedCamera.name} className="w-full h-full object-cover" src={`http://127.0.0.1:3001/api/proxy/camera?url=${encodeURIComponent(selectedCamera.stream_url)}`} />
            ) : (
              <img alt={selectedCamera.name} className="w-full h-full object-cover" src={selectedCamera.src} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-4 left-4 flex items-center gap-[4px] px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
            </div>
            <div className="absolute bottom-6 left-6 pointer-events-none z-10">
              <p className="text-2xl font-bold text-white leading-tight drop-shadow-md">{selectedCamera.name}</p>
            </div>
            <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <Odometer prob={Math.round((selectedCamera.lat % 1) * 20)} size="lg" className="text-white" />
            </div>
            <button
              onClick={() => setSelectedCamera(null)}
              title="Cerrar vista"
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-colors z-20 shadow-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

    </>
  );
}
