"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text" | "card" | "metric";
}

export default function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg";
  
  let variantClasses = "";
  if (variant === "circle") {
    variantClasses = "rounded-full";
  } else if (variant === "text") {
    variantClasses = "h-4 w-3/4 mb-2";
  } else if (variant === "card") {
    variantClasses = "w-full aspect-video rounded-xl";
  } else if (variant === "metric") {
    variantClasses = "w-full h-24 rounded-2xl";
  }

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} />
  );
}

