"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
      }}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {theme === "system" ? (
        <Monitor className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      ) : resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      ) : (
        <Sun className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      )}
    </Button>
  );
}
