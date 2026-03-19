"use client";

import { useState } from "react";
import { Shield, Upload, Loader2, CheckCircle } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClaimStatus } from "@/lib/types";

interface ClaimProfileButtonProps {
  providerId: string;
  claimStatus: ClaimStatus;
  claimantUid?: string;
}

export function ClaimProfileButton({ providerId, claimStatus, claimantUid }: ClaimProfileButtonProps) {
  const { user, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Don't show if already claimed/approved
  if (claimStatus === "approved") return null;
  if (claimStatus === "pending" && claimantUid !== user?.uid) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-sm text-amber-700 font-medium">Profil ini sedang dalam proses klaim.</p>
      </div>
    );
  }
  if (claimStatus === "pending" && claimantUid === user?.uid) {
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center">
        <Shield className="h-5 w-5 text-sky-soft mx-auto mb-1" />
        <p className="text-sm text-sky-700 font-medium">Klaim Anda sedang ditinjau.</p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!user) return;
    if (!proofText && !proofFile) return;

    setSubmitting(true);
    try {
      let proofUrl: string | undefined;

      if (proofFile) {
        const storageRef = ref(storage, `claim-proofs/${providerId}/${Date.now()}_${proofFile.name}`);
        const snapshot = await uploadBytes(storageRef, proofFile);
        proofUrl = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(doc(db, "providers", providerId), {
        claim_status: "pending",
        claimant_uid: user.uid,
        claim_proof_text: proofText || null,
        claim_proof_url: proofUrl || null,
        updated_at: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Claim error:", err);
      alert("Gagal mengirim klaim. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-sage-light border border-sage/20 rounded-xl p-4 text-center animate-scale-in">
        <CheckCircle className="h-5 w-5 text-sage mx-auto mb-1" />
        <p className="text-sm text-sage font-semibold">Klaim berhasil dikirim!</p>
        <p className="text-xs text-warm-gray mt-1">Tim kami akan meninjau dalam 1-2 hari kerja.</p>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-5 bg-bark text-white hover:bg-bark-light transition-colors active:translate-y-px" />
        }
      >
        <Shield className="h-4 w-4" />
        Klaim Profil Ini
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto md:!inset-auto md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 md:rounded-2xl md:border md:border-bark/10 md:max-w-lg md:w-full">
        <SheetHeader>
          <SheetTitle className="font-display font-bold text-bark">Klaim Profil</SheetTitle>
          <SheetDescription>
            Buktikan bahwa Anda adalah pemilik usaha ini untuk mengelola profil.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {!user ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-warm-gray">Login terlebih dahulu untuk mengklaim profil.</p>
              <Button
                onClick={signInWithGoogle}
                className="bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-10 px-6"
              >
                Login dengan Google
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-bark">
                  Bukti Kepemilikan
                </label>
                <p className="text-xs text-warm-gray">
                  Sertakan link media sosial bisnis atau unggah foto KTP/kartu nama.
                </p>
                <textarea
                  placeholder="Link Instagram/Facebook bisnis, atau keterangan lain..."
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-bark">
                  Upload Dokumen (opsional)
                </label>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="file:mr-3 file:rounded-md file:border-0 file:bg-cream-dark file:px-3 file:py-1 file:text-xs file:font-medium file:text-bark h-auto py-2"
                  />
                </div>
                {proofFile && (
                  <p className="text-xs text-sage flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    {proofFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || (!proofText && !proofFile)}
                className="w-full bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-11 font-semibold disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Klaim"
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
