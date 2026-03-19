"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

interface AdminClosureButtonProps {
  reportId: string;
  providerId: string;
}

export function AdminClosureButton({ reportId, providerId }: AdminClosureButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "approved" | "rejected">("idle");

  async function handleAction(action: "approve" | "reject") {
    setStatus("loading");
    try {
      // Update report status
      await updateDoc(doc(db, "closure_reports", reportId), {
        status: action === "approve" ? "approved" : "rejected",
        resolved_at: serverTimestamp(),
      });

      // If approved, mark provider as closed
      if (action === "approve") {
        await updateDoc(doc(db, "providers", providerId), {
          business_status: "CLOSED_PERMANENTLY",
          updated_at: serverTimestamp(),
        });
      }

      setStatus(action === "approve" ? "approved" : "rejected");
    } catch (err) {
      console.error("Admin closure action error:", err);
      alert("Gagal memproses. Silakan coba lagi.");
      setStatus("idle");
    }
  }

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
        <CheckCircle className="h-3.5 w-3.5" /> Ditutup
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage">
        <XCircle className="h-3.5 w-3.5" /> Ditolak
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handleAction("approve")}
        disabled={status === "loading"}
        variant="destructive"
        className="rounded-lg h-8 px-3 text-xs"
        size="sm"
      >
        {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
        Tutup
      </Button>
      <Button
        onClick={() => handleAction("reject")}
        disabled={status === "loading"}
        className="bg-sage hover:bg-sage/80 text-white rounded-lg h-8 px-3 text-xs"
        size="sm"
      >
        <XCircle className="h-3 w-3" />
        Tolak
      </Button>
    </div>
  );
}
