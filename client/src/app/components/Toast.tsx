"use client";

import React from "react";

interface ToastProps {
  type?: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}

export default function Toast({ type = "info", message, onClose }: ToastProps) {
  const bg = type === "error" ? "bg-red-600" : type === "success" ? "bg-green-600" : "bg-sky-600";
  return (
    <div className={`fixed right-6 top-6 z-50 max-w-xs ${bg} text-white rounded-lg shadow-lg`}>
      <div className="p-3 flex items-start gap-3">
        <div className="flex-1 text-sm">{message}</div>
        {onClose && (
          <button aria-label="close" onClick={onClose} className="opacity-90 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
