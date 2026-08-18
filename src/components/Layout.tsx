import {
  GalleryHorizontalEnd,
  Image,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Pill,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/hero-slides", label: "Hero slider", icon: GalleryHorizontalEnd },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/articles", label: "Articles", icon: Newspaper },
  { to: "/gallery", label: "Gallery", icon: Image },
];

/** A slim Tibetan-inspired flourish — a centered diamond between two fading rules —
 *  used in place of a plain section heading in the sidebar. */
function TibetanDivider() {
  return (
    <div
      className="flex items-center gap-2 px-3 pb-3 pt-4 text-primary/55"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/45" />
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M8 1.5 14.5 8 8 14.5 1.5 8Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <circle cx="8" cy="8" r="1.35" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/45" />
    </div>
  );
}

export function Layout() {
  const { profile, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initial =
    profile?.name?.charAt(0).toUpperCase() ||
    profile?.email?.charAt(0).toUpperCase() ||
    "?";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <img src="/logo.png" alt="" className="h-8 w-8" />
          <span className="font-brand text-lg text-primary">Kunphen Studio</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          <TibetanDivider />
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t px-3 py-3">
          <div className="flex items-center justify-between rounded-md px-2 py-1.5">
            <span className="text-sm font-medium text-muted-foreground">
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </span>
            <ThemeToggle />
          </div>
          <p className="mt-2 px-2 text-[11px] text-muted-foreground">
            Kunphen Tibetan Medical Centre
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          {/* Wordmark shows here only when the sidebar is collapsed away */}
          <div className="flex items-center gap-2 sm:hidden">
            <img src="/logo.png" alt="" className="h-7 w-7" />
            <span className="font-brand text-base text-primary">Kunphen</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle className="sm:hidden" />
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">
                {profile?.name || "Admin"}
              </div>
              <div className="text-xs leading-tight text-muted-foreground">
                {profile?.email}
              </div>
            </div>
            {profile?.picture ? (
              <img
                src={profile.picture}
                alt=""
                className="h-8 w-8 rounded-full ring-1 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/15">
                {initial}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile nav — the sidebar is hidden below sm */}
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-4 py-2 sm:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
