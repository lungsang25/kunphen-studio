import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const DEV_AUTH_ENABLED = import.meta.env.VITE_DEV_AUTH_ENABLED === "true";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Kunphen Studio</CardTitle>
          <CardDescription>
            Sign in to manage medicines, articles, and gallery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center">
              <GoogleLogin
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
            <p className="rounded-md bg-muted p-3 text-center text-xs text-muted-foreground">
              Google sign-in is not configured yet. Set
              VITE_GOOGLE_CLIENT_ID to enable it.
            </p>
          )}

          {DEV_AUTH_ENABLED && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Dev bypass
              </p>
              <div className="space-y-2">
                <Label htmlFor="dev-email">Email</Label>
                <Input
                  id="dev-email"
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={busy || !devEmail}
                onClick={handleDevLogin}
              >
                Continue as dev user
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
