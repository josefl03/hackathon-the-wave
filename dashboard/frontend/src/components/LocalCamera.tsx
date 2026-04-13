"use client";

import React, { useState, useRef, useEffect } from "react";
import Odometer from "./Odometer";

interface Detection {
  square: [number, number, number, number]; // [x1, y1, x2, y2]
  probability: number;
  class: string;
}

export default function LocalCamera() {
  // ── UI State (render triggers only) ──────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [status, setStatus] = useState<"Inactivo" | "Conectando..." | "Activo" | "Error">("Inactivo");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [hazardLevel, setHazardLevel] = useState(0);
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 });
  const [telemetry, setTelemetry] = useState({ sent: 0, received: 0 });
  const [latency, setLatency] = useState<number | null>(null);

  // ── Refs (never stale inside callbacks) ──────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Running flag: true while we are waiting for an inference response
  const awaitingRef = useRef(false);
  // Overall alive flag for the loop
  const aliveRef = useRef(false);

  // ── Frame loop ────────────────────────────────────────────────────────────
  // Pure-ref version — no stale closures, safe to call from WS handlers
  function scheduleNext(delayMs = 50) {
    if (!aliveRef.current) return;
    setTimeout(captureFrame, delayMs);
  }

  function captureFrame() {
    const ws = wsRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!aliveRef.current || !ws || !video || !canvas) return;
    if (ws.readyState !== WebSocket.OPEN) { scheduleNext(300); return; }
    if (video.readyState < 2) { scheduleNext(200); return; } // waiting for data

    // Sync canvas size to native video resolution
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      setVideoDims({ width: video.videoWidth, height: video.videoHeight });
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob || !aliveRef.current) return;
        const ws2 = wsRef.current;
        if (!ws2 || ws2.readyState !== WebSocket.OPEN) { scheduleNext(300); return; }
        awaitingRef.current = true;
        ws2.send(blob);
        setTelemetry(t => ({ ...t, sent: t.sent + 1 }));
        // Fallback: if no response arrives in 5 s, unlock and retry
        setTimeout(() => {
          if (awaitingRef.current) {
            awaitingRef.current = false;
            scheduleNext();
          }
        }, 5000);
      },
      "image/jpeg",
      0.8
    );
  }

  // ── Camera start ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    setStatus("Conectando...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 9999 },
          height: { ideal: 9999 }
        },
      });
      streamRef.current = stream;

      // Attach stream to the video element right now (it is already rendered
      // in the DOM when status === "Conectando..." keeps the inactive view,
      // but we set isActive=true just after ws.onopen, so we attach via ref
      // after the state flip in a useEffect below).

      const wsUrl = `ws://${window.location.hostname}:3001`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        aliveRef.current  = true;
        awaitingRef.current = false;
        setIsActive(true);   // triggers render → video element mounts
        setStatus("Activo");
        // Give React one tick + video warm-up before the first capture
        setTimeout(captureFrame, 800);
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string);
          setTelemetry(t => ({ ...t, received: t.received + 1 }));

          if (data.type === "inference_result") {
            setLatency(data.latency_sec);
            const dets: Detection[] = data.detections || [];
            setDetections(dets);
            if (dets.length > 0) {
              const max = Math.max(...dets.map(d => d.probability));
              setHazardLevel(Math.round(max * 100));
            } else {
              setHazardLevel(0);
            }
          }
        } catch {/* ignore bad JSON */} finally {
          // Release lock and queue next frame
          awaitingRef.current = false;
          scheduleNext();
        }
      };

      ws.onclose = () => { aliveRef.current = false; setIsActive(false); setStatus("Inactivo"); };
      ws.onerror = () => { aliveRef.current = false; setIsActive(false); setStatus("Error"); };

    } catch (err) {
      console.error(err);
      setStatus("Error");
    }
  };

  // ── Attach stream once the video element is in the DOM ───────────────────
  useEffect(() => {
    if (isActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isActive]);

  // ── Camera stop ───────────────────────────────────────────────────────────
  const stopCamera = () => {
    aliveRef.current = false;
    setIsActive(false);
    setIsFullScreen(false);
    setStatus("Inactivo");
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setDetections([]);
    setHazardLevel(0);
    setTelemetry({ sent: 0, received: 0 });
    setVideoDims({ width: 0, height: 0 });
  };

  useEffect(() => () => { stopCamera(); }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {isFullScreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          onClick={() => setIsFullScreen(false)}
        />
      )}
      <div
        className={
          isFullScreen
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-center items-center border-[3px] border-primary"
            : "relative group rounded-xl overflow-hidden aspect-video border-2 border-outline-variant shadow-md bg-black flex flex-col justify-center items-center cursor-pointer hover:border-primary/50 transition-colors"
        }
        onClick={() => { if (!isFullScreen && isActive) setIsFullScreen(true); }}
      >
        {/* ── Inactive / error state ── */}
        {!isActive && (
          <>
            <span className="material-symbols-outlined text-4xl text-white/50 mb-3">
              {status === "Error" ? "error" : "videocam_off"}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); startCamera(); }}
              disabled={status === "Conectando..."}
              className="px-4 py-1.5 bg-secondary text-on-secondary rounded-lg text-sm font-bold hover:bg-secondary/90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {status === "Conectando..." ? "Conectando..." : "Usar local"}
            </button>
          </>
        )}

        {/* ── Active state ── */}
        {isActive && (
          <>
            {/* Live video */}
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
            {/* Off-screen capture canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none z-10" />

            {/* Detection bounding boxes */}
            {videoDims.width > 0 && detections.map((det, idx) => {
              const [x1, y1, x2, y2] = det.square;
              const left   = (x1 / videoDims.width)  * 100;
              const top    = (y1 / videoDims.height) * 100;
              const width  = ((x2 - x1) / videoDims.width)  * 100;
              const height = ((y2 - y1) / videoDims.height) * 100;
              const isFireSmoke = det.class.toLowerCase().includes("fire") || det.class.toLowerCase().includes("smoke");
              const color = isFireSmoke ? "border-red-500" : "border-blue-400";
              const bg    = isFireSmoke ? "bg-red-500"    : "bg-blue-400";

              return (
                <div
                  key={idx}
                  className={`absolute border-2 ${color} z-20`}
                  style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                >
                  <span className={`absolute -top-5 left-0 px-1 py-[2px] ${bg} text-white text-[9px] font-bold tracking-wide rounded-t-sm whitespace-nowrap`}>
                    {det.class.toUpperCase()} {Math.round(det.probability * 100)}%
                  </span>
                </div>
              );
            })}

            {/* Live badge (top-left) */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-full z-30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
            </div>

            {/* Close / exit-fullscreen button (top-right) */}
            {isFullScreen ? (
              <button
                onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-full text-white/80 hover:text-white z-30"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); stopCamera(); }}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-full text-white/80 hover:text-white z-30"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}

            {/* Technical Stats (top-right, below close button) - ONLY in fullscreen */}
            {isFullScreen && (
              <div className="absolute top-16 right-4 flex flex-col items-end gap-1.5 z-30 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/5 flex flex-col items-end">
                  <p className="text-[8px] font-mono text-white/40 leading-none uppercase mb-2 tracking-tighter border-b border-white/10 w-full text-right pb-1">System Pipeline</p>
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-[9px] font-mono text-secondary-fixed leading-tight">
                      RES: <span className="text-white font-bold">{videoDims.width}×{videoDims.height}</span>
                    </p>
                    <p className="text-[9px] font-mono text-secondary-fixed leading-tight">
                      LATENCY: <span className={latency && latency > 0.5 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                        {latency ? `${(latency * 1000).toFixed(0)}ms` : '--'}
                      </span>
                    </p>
                    <p className="text-[9px] font-mono text-secondary-fixed leading-tight">
                      NETWORK: <span className="text-white">↑{telemetry.sent} ↓{telemetry.received}</span>
                    </p>
                    <p className="text-[9px] font-mono text-secondary-fixed leading-tight">
                      DET: <span className="text-white font-bold">{detections.length}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info (bottom-left) */}
            <div className="absolute bottom-2 left-2 z-30">
              <p className="text-xs font-bold text-white drop-shadow">Webcam / Local</p>
            </div>

            {/* Odometer (bottom-right) */}
            <div className={`absolute bottom-2 right-2 z-40 ${isFullScreen ? 'bg-black/40 p-2 rounded-xl' : 'bg-black/30 p-1 rounded-lg'} backdrop-blur-md border border-white/10`}>
              <Odometer prob={hazardLevel} size={isFullScreen ? "lg" : "sm"} className={hazardLevel > 50 ? "text-red-500" : "text-white"} />
            </div>

          </>
        )}
      </div>
    </>
  );
}
