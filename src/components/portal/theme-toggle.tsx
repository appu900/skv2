"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, setTheme, useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Keeps <html> in sync with the saved theme while a portal is open, and back to light when it closes.
export function PortalTheme() {
  const theme = useTheme();
  useEffect(() => {
    applyTheme(theme);
    return () => applyTheme("light");
  }, [theme]);
  return null;
}

export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} className="relative">
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}
