import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={cn(
        "relative flex h-7 w-[3.25rem] shrink-0 items-center rounded-full border transition-colors duration-300",
        isDark ? "border-primary/30 bg-primary/15" : "border-border bg-muted",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-in-out",
          isDark && "translate-x-6",
        )}
      >
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 text-amber-500 transition-all duration-300",
            isDark
              ? "scale-0 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 text-primary transition-all duration-300",
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
