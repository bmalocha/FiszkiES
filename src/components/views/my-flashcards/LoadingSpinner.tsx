import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number; // Optional size prop (default: 24)
  className?: string; // Optional additional classes
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <div className={`flex justify-center items-center p-4 ${className}`}>
      <Loader2 style={{ width: size, height: size }} className="animate-spin text-primary" />
      <span className="sr-only">Ładowanie...</span>
    </div>
  );
}
