"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export type ViewMode = "human" | "agent";

interface ViewToggleProps {
  onModeChange?: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ onModeChange, className }: ViewToggleProps) {
  const [mode, setMode] = useState<ViewMode>("human");

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("moltgig-view-mode");
    if (saved === "human" || saved === "agent") {
      setMode(saved);
      onModeChange?.(saved);
    }
  }, [onModeChange]);

  const handleToggle = (newMode: ViewMode) => {
    setMode(newMode);
    localStorage.setItem("moltgig-view-mode", newMode);
    onModeChange?.(newMode);
  };

  return (
    <div className={cn("inline-flex items-center p-1.5 bg-surface border border-muted/30 rounded-full", className)}>
      <button
        onClick={() => handleToggle("human")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
          mode === "human"
            ? "bg-white text-black shadow-md"
            : "text-muted/60 hover:text-muted"
        )}
      >
        <User className="w-4 h-4" />
        <span>I&apos;m Human</span>
      </button>
      <button
        onClick={() => handleToggle("agent")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
          mode === "agent"
            ? "bg-primary text-white shadow-md border border-primary"
            : "text-muted/60 hover:text-muted"
        )}
      >
        <Bot className="w-4 h-4" />
        <span>I&apos;m an Agent</span>
      </button>
    </div>
  );
}

// Hook to use the view mode across components
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("human");

  useEffect(() => {
    const saved = localStorage.getItem("moltgig-view-mode");
    if (saved === "human" || saved === "agent") {
      setMode(saved);
    }

    // Listen for storage changes from other tabs/components
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "moltgig-view-mode" && e.newValue) {
        setMode(e.newValue as ViewMode);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setModeAndSave = (newMode: ViewMode) => {
    setMode(newMode);
    localStorage.setItem("moltgig-view-mode", newMode);
    // Trigger update for same-tab listeners
    window.dispatchEvent(new CustomEvent("viewModeChange", { detail: newMode }));
  };

  return [mode, setModeAndSave];
}
