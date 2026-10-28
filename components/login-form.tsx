"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Camera, Lock, ArrowLeft } from "lucide-react";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  const [fatal, setFatal] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-sm shadow-lg border-border/80 bg-card">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary mb-1">
          <Camera className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-extrabold tracking-tight">Login Admin</CardTitle>
        <CardDescription className="text-xs">
          Panel kontrol internal vintagemeew
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={async (fd) => {
            setFatal(null);
            try {
              await action(fd);
            } catch (e) {
              if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
              if (e && typeof e === "object" && "digest" in e) throw e;
              setFatal("Gagal memproses. Silakan coba lagi.");
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              placeholder="Username admin"
              className="rounded-full h-10 px-4"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="rounded-full h-10 px-4"
            />
          </div>

          {(state.error || fatal) && (
            <p role="alert" className="rounded-xl bg-destructive/10 p-2.5 text-xs font-semibold text-destructive border border-destructive/20 text-center">
              {state.error ?? fatal}
            </p>
          )}

          <Button
            disabled={pending}
            size="lg"
            className="w-full text-sm font-bold shadow-sm rounded-full mt-2"
          >
            <Lock className="h-4 w-4 mr-1.5" />
            {pending ? "Memeriksa kredensial…" : "Masuk ke Panel"}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-border/60 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda Toko</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
