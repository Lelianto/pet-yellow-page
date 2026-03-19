"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { buildTrialFields } from "@/lib/tiers";

interface AdminApproveButtonProps {
  providerId: string;
  claimantUid?: string;
}

export function AdminApproveButton({ providerId, claimantUid }: AdminApproveButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "approved" | "rejected">("idle");

  async function handleAction(action: "approve" | "reject") {
    setStatus("loading");
    try {
      const updates: Record<string, unknown> = {
        updated_at: serverTimestamp(),
      };

      if (action === "approve") {
        updates.is_verified = true;
        updates.claim_status = "approved";
        if (claimantUid) {
          updates.owner_uid = claimantUid;
        }
        // Start 14-day Growth trial
        const trial = buildTrialFields();
        Object.assign(updates, {
          ...trial,
          premium_until: Timestamp.fromDate(trial.premium_until),
        });
      } else {
        updates.claim_status = "rejected";
      }

      await updateDoc(doc(db, "providers", providerId), updates);

      // Rebuild homepage cache in background
      fetch("/api/rebuild-cache", { method: "POST" }).catch(() => {});

      setStatus(action === "approve" ? "approved" : "rejected");
    } catch (err) {
      console.error("Admin action error:", err);
      alert("Gagal memproses. Silakan coba lagi.");
      setStatus("idle");
    }
  }

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage">
        <CheckCircle className="h-3.5 w-3.5" /> Disetujui
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
        <XCircle className="h-3.5 w-3.5" /> Ditolak
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handleAction("approve")}
        disabled={status === "loading"}
        className="bg-sage hover:bg-sage/80 text-white rounded-lg h-8 px-3 text-xs"
        size="sm"
      >
        {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
        Approve
      </Button>
      <Button
        onClick={() => handleAction("reject")}
        disabled={status === "loading"}
        variant="destructive"
        className="rounded-lg h-8 px-3 text-xs"
        size="sm"
      >
        <XCircle className="h-3 w-3" />
        Reject
      </Button>
    </div>
  );
}
