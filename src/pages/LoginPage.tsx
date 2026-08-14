import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Image, Newspaper, Pill, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const DEV_AUTH_ENABLED = import.meta.env.VITE_DEV_AUTH_ENABLED === "true";

const highlights = [
  { icon: Pill, label: "Medicines", copy: "Curate the Sowa Rigpa catalog" },
  { icon: Newspaper, label: "Articles", copy: "Write and publish to the site" },
  { icon: Image, label: "Gallery", copy: "Manage clinic photography" },
];

export function LoginPage() {
  const { loginWithGoogle, loginDev } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname ?? "/";

  const [devEmail, setDevEmail] = useState("dev@example.com");
  const [busy, setBusy] = useState(false);

  const handleDevLogin = async () => {
    setBusy(true);
    try {
      await loginDev(devEmail);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dev login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <img
            src="/logo.png"
            alt=""
            className="h-10 w-10 rounded-md bg-white/95 p-1"
          />
          <span className="font-brand text-xl">Kunphen Studio</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Everything on the Kunphen site, in one place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/75">
            Sign in to manage the content your visitors see — medicines,
            articles, and gallery imagery.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, label, copy }) => (
              <li key={label} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-sm text-primary-foreground/70">
                    {copy}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Kunphen Tibetan Medical Centre
        </p>
      </aside>

      {/* Sign-in panel */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
        <div className="w-full max-w-sm">
          {/* Mobile lockup — the brand panel is hidden below lg */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="" className="h-10 w-10" />
            <span className="font-brand text-xl text-primary">
              Kunphen Studio
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your authorized Google account to continue.
          </p>

          <div className="mt-8">
            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center [color-scheme:light]">
                <GoogleLogin
                  width="320"
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                  logo_alignment="left"
                  onSuccess={async (response) => {
                    if (!response.credential) {
                      toast.error("Google did not return a credential");
                      return;
                    }
                    try {
                      await loginWithGoogle(response.credential);
                      navigate(from, { replace: true });
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Sign-in failed",
                      );
                    }
                  }}
                  onError={() => toast.error("Google sign-in failed")}
                />
              </div>
            ) : (
              <p className="rounded-lg border border-dashed bg-muted/60 p-4 text-center text-xs leading-relaxed text-muted-foreground">
                Google sign-in is not configured yet. Set{" "}
                <code className="font-mono text-[11px]">
                  VITE_GOOGLE_CLIENT_ID
                </code>{" "}
                to enable it.
              </p>
            )}
          </div>

          <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              Access is limited to Kunphen admin only
            </span>
          </p>

          {DEV_AUTH_ENABLED && (
            <div className="mt-10 rounded-lg border border-dashed bg-muted/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Development only
              </p>
              <div className="mt-3 space-y-2">
                <Label htmlFor="dev-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="dev-email"
                  type="email"
                  className="h-9 bg-background"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full bg-background"
                disabled={busy || !devEmail}
                onClick={handleDevLogin}
              >
                {busy ? "Signing in..." : "Continue as dev user"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
