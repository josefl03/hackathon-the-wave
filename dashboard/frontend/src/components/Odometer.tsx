"use client";

import React from "react";

interface OdometerProps {
  prob: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Odometer: React.FC<OdometerProps> = ({ prob, className = "", size = "sm" }) => {
  const sizeClasses = {
    sm: "w-10 h-6",
    md: "w-16 h-10",
    lg: "w-24 h-14",
  };

  const textClasses = {
    sm: "text-[10px]",
    md: "text-[12px]",
    lg: "text-[14px]",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} title={`Probabilidad: ${prob}%`}>
      <div className={`${sizeClasses[size]} relative flex items-end justify-center`}>
        <svg viewBox="0 0 100 55" className="w-full drop-shadow-sm overflow-visible">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="opacity-20" />
          <g style={{ transform: `rotate(${Math.min(Math.max((prob / 100) * 180 - 90, -90), 90)}deg)`, transformOrigin: "50px 50px" }} className="transition-transform duration-700 ease-out">
            <polygon points="46,50 54,50 50,12" fill="currentColor" />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
          </g>
        </svg>
      </div>
      <span className={`${textClasses[size]} font-mono font-bold text-current leading-none mt-[2px]`}>{prob}%</span>
    </div>
  );
};

export default Odometer;
