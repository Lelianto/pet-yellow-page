"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, User, LayoutDashboard } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function HeaderAuth() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasProvider(false);
      return;
    }
    const q = query(
      collection(db, "providers"),
      where("owner_uid", "==", user.uid)
    );
    getDocs(q).then((snap) => setHasProvider(!snap.empty)).catch(() => {});
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <Button
        onClick={signInWithGoogle}
        variant="ghost"
        size="sm"
        className="text-bark-light hover:text-terracotta gap-1.5 text-sm"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden md:inline">Login</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasProvider && (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-bark-light hover:text-terracotta transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>
      )}
      <div className="flex items-center gap-1.5">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <User className="h-4 w-4 text-warm-gray" />
        )}
        <span className="hidden md:inline text-xs font-medium text-bark-light max-w-[100px] truncate">
          {user.displayName?.split(" ")[0]}
        </span>
      </div>
      <Button
        onClick={signOut}
        variant="ghost"
        size="icon-xs"
        className="text-warm-gray hover:text-terracotta"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
