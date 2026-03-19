"use client";

import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").filter(Boolean);

interface AdminAuthGateProps {
  children: React.ReactNode;
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-terracotta animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
        <Shield className="h-10 w-10 text-bark/20 mx-auto" />
        <h2 className="font-display font-bold text-bark">Login Diperlukan</h2>
        <p className="text-sm text-warm-gray">Halaman ini hanya untuk admin.</p>
        <Button
          onClick={signInWithGoogle}
          className="bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-10 px-6"
        >
          Login dengan Google
        </Button>
      </div>
    );
  }

  if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(user.uid)) {
    return (
      <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-3">
        <Shield className="h-10 w-10 text-red-300 mx-auto" />
        <h2 className="font-display font-bold text-bark">Akses Ditolak</h2>
        <p className="text-sm text-warm-gray">Anda tidak memiliki akses ke halaman ini.</p>
        <p className="text-xs text-warm-gray/60 font-mono">UID: {user.uid}</p>
      </div>
    );
  }

  return <>{children}</>;
}
