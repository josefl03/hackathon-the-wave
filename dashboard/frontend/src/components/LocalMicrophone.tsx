"use client";

import React, { useState, useRef, useEffect } from "react";
import Odometer from "./Odometer";

interface ClassPrediction {
  class: string;
  probability: number;
}

export default function LocalMicrophone() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<"Inactivo" | "Conectando..." | "Activo" | "Error">("Inactivo");
  const [fireProbability, setFireProbability] = useState(0);
  const [topClasses, setTopClasses] = useState<ClassPrediction[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(false);

  const startMicrophone = async () => {
    setStatus("Conectando...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const wsUrl = `ws://${window.location.hostname}:3001`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        aliveRef.current = true;
        setIsActive(true);
        setStatus("Activo");

        // Set up MediaRecorder to capture in chunks
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // Start recording with 1-second chunks
        mediaRecorder.start(1000);
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string);
          if (data.type === "audio_inference_result") {
            setLatency(data.latency_sec);
            setFireProbability(Math.round(data.fire_probability * 100));
            setTopClasses(data.top_classes || []);
          }
        } catch (e) {
          console.error("Failed to parse audio inference result", e);
        }
      };

      ws.onclose = () => {
        stopMicrophone();
      };

      ws.onerror = () => {
        setStatus("Error");
        stopMicrophone();
      };

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setStatus("Error");
    }
  };

  const stopMicrophone = () => {
    aliveRef.current = false;
    setIsActive(false);
    setStatus("Inactivo");
    
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    
    wsRef.current?.close();
    wsRef.current = null;
    
    setFireProbability(0);
    setTopClasses([]);
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  const hasFire = fireProbability > 50;

  return (
    <div className={`bg-surface-container-lowest p-2 rounded-xl shadow-sm flex items-center justify-between border-2 transition-all duration-300 ${isActive ? (hasFire ? 'border-error shadow-lg shadow-error/10' : 'border-secondary shadow-md') : 'border-outline-variant border-dashed'}`}>
      <div className="flex items-center gap-1.5 overflow-hidden">
        <div className="relative">
          <span 
            className={`material-symbols-outlined text-xl transition-all duration-500 ${isActive ? (hasFire ? 'text-error scale-110' : 'text-secondary') : 'text-on-surface-variant'}`}
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {isActive ? 'mic' : 'mic_off'}
          </span>
          {isActive && (
            <span className={`absolute -inset-1 rounded-full animate-ping opacity-20 ${hasFire ? 'bg-error' : 'bg-secondary'}`} />
          )}
        </div>
        
        <div className="flex flex-col justify-center overflow-hidden">
          {isActive && hasFire && (
              <span className="text-[9px] font-black text-error uppercase leading-tight animate-bounce">
                ¡Fuego Detectado!
              </span>
          )}
          <span className={`text-base font-bold leading-tight truncate ${isActive ? (hasFire ? 'text-error' : 'text-on-surface') : 'text-on-surface-variant'}`}>
            Micro Local {isActive && <span className="text-[10px] font-normal opacity-60 ml-1">({latency ? `${(latency*1000).toFixed(0)}ms` : '...'})</span>}
          </span>
          {isActive && topClasses.length > 0 && (
            <span className="text-[10px] text-on-surface-variant truncate opacity-80 leading-tight">
              {topClasses[0].class} ({Math.round(topClasses[0].probability * 100)}%)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isActive ? (
          <>
            <Odometer prob={fireProbability} className={hasFire ? 'text-error' : 'text-on-surface-variant'} />
            <button 
              onClick={stopMicrophone}
              className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
              title="Detener"
            >
              <span className="material-symbols-outlined text-lg">stop</span>
            </button>
          </>
        ) : (
          <button 
            onClick={startMicrophone}
            disabled={status === "Conectando..."}
            className="px-3 py-1 bg-secondary text-on-secondary rounded-lg text-[10px] font-bold hover:bg-secondary/90 transition-all uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-50"
          >
            {status === "Conectando..." ? "..." : "Usar local"}
          </button>
        )}
      </div>
    </div>
  );
}
