import { Image, LayoutDashboard, LogOut, Newspaper, Pill } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/articles", label: "Articles", icon: Newspaper },
  { to: "/gallery", label: "Gallery", icon: Image },
];

export function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <img src="/logo.png" alt="Kunphen Logo" className="h-8 w-8" />
          <span className="text-lg font-semibold text-primary">
            Kunphen Studio
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end gap-3 border-b px-6">
          {profile?.picture ? (
            <img
              src={profile.picture}
              alt={profile.name}
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {profile?.name?.charAt(0).toUpperCase() ||
                profile?.email?.charAt(0).toUpperCase() ||
                "?"}
            </div>
          )}
          <div className="text-sm">
            <div className="font-medium">{profile?.name || "Admin"}</div>
            <div className="text-xs text-muted-foreground">
              {profile?.email}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
