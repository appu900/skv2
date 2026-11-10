"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-boot";

export { THEMED_PATH } from "./theme-boot";

export type Theme = "light" | "dark";

const CHANGE_EVENT = "sap-theme-change";

function read(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // blocked storage: the switch still works for this page view
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// The saved theme; the server render is always light.
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}
