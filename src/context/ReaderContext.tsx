"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "sepia";
export type FontFamily = "sans" | "serif" | "sarabun";

export interface LastReadInfo {
  slug: string;
  title: string;
  order: number;
  updatedAt?: string;
  scrollY?: number;
}

interface ReaderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  lineHeight: "normal" | "relaxed" | "loose";
  setLineHeight: (lh: "normal" | "relaxed" | "loose") => void;
  lastRead: LastReadInfo | null;
  saveLastRead: (info: LastReadInfo) => void;
  readChapters: string[];
  markChapterAsRead: (slug: string) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [fontSize, setFontSizeState] = useState<number>(18);
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("sans");
  const [lineHeight, setLineHeightState] = useState<"normal" | "relaxed" | "loose">("relaxed");
  const [lastRead, setLastReadState] = useState<LastReadInfo | null>(null);
  const [readChapters, setReadChaptersState] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("novel_theme") as Theme | null;
      if (savedTheme && ["light", "dark", "sepia"].includes(savedTheme)) {
        setThemeState(savedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
      }

      const savedFontSize = localStorage.getItem("novel_fontsize");
      if (savedFontSize) {
        const parsed = parseInt(savedFontSize, 10);
        if (parsed >= 14 && parsed <= 32) {
          setFontSizeState(parsed);
        }
      }

      const savedFontFamily = localStorage.getItem("novel_fontfamily") as FontFamily | null;
      if (savedFontFamily && ["sans", "serif", "sarabun"].includes(savedFontFamily)) {
        setFontFamilyState(savedFontFamily);
      }

      const savedLineHeight = localStorage.getItem("novel_lineheight") as "normal" | "relaxed" | "loose" | null;
      if (savedLineHeight && ["normal", "relaxed", "loose"].includes(savedLineHeight)) {
        setLineHeightState(savedLineHeight);
      }

      const savedLastRead = localStorage.getItem("novel_last_read");
      if (savedLastRead) {
        setLastReadState(JSON.parse(savedLastRead));
      }

      const savedReadChapters = localStorage.getItem("novel_read_chapters");
      if (savedReadChapters) {
        setReadChaptersState(JSON.parse(savedReadChapters));
      }
    } catch (e) {
      console.error("Error reading localStorage", e);
    }
  }, []);

  // Update theme class on HTML / body
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-sepia", "dark");

    if (theme === "dark") {
      root.classList.add("dark", "theme-dark");
    } else if (theme === "sepia") {
      root.classList.add("theme-sepia");
    } else {
      root.classList.add("theme-light");
    }

    try {
      localStorage.setItem("novel_theme", theme);
    } catch {}
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setFontSize = (size: number) => {
    const clamped = Math.min(32, Math.max(14, size));
    setFontSizeState(clamped);
    try {
      localStorage.setItem("novel_fontsize", clamped.toString());
    } catch {}
  };

  const increaseFontSize = () => {
    setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    setFontSize(fontSize - 2);
  };

  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
    try {
      localStorage.setItem("novel_fontfamily", font);
    } catch {}
  };

  const setLineHeight = (lh: "normal" | "relaxed" | "loose") => {
    setLineHeightState(lh);
    try {
      localStorage.setItem("novel_lineheight", lh);
    } catch {}
  };

  const saveLastRead = (info: LastReadInfo) => {
    setLastReadState(info);
    try {
      localStorage.setItem("novel_last_read", JSON.stringify(info));
      markChapterAsRead(info.slug);
    } catch {}
  };

  const markChapterAsRead = (slug: string) => {
    setReadChaptersState((prev) => {
      if (prev.includes(slug)) return prev;
      const updated = [...prev, slug];
      try {
        localStorage.setItem("novel_read_chapters", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <ReaderContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        fontFamily,
        setFontFamily,
        lineHeight,
        setLineHeight,
        lastRead,
        saveLastRead,
        readChapters,
        markChapterAsRead,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error("useReader must be used within a ReaderProvider");
  }
  return context;
}
