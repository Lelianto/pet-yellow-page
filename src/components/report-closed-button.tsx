"use client";

import { useState } from "react";
import { Flag, Loader2, CheckCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

interface ReportClosedButtonProps {
  providerId: string;
  providerName: string;
}

export function ReportClosedButton({ providerId, providerName }: ReportClosedButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await addDoc(collection(db, "closure_reports"), {
        provider_id: providerId,
        provider_name: providerName,
        reason: reason || null,
        reported_by_uid: user?.uid || null,
        status: "pending",
        created_at: serverTimestamp(),
      });
      setSubmitted(true);
      setReason("");
    } catch (err) {
      console.error("Report error:", err);
      alert("Gagal mengirim laporan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitted(false); }}>
      <SheetTrigger
        render={
          <button className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-warm-gray hover:text-red-500 transition-colors py-2" />
        }
      >
        <Flag className="h-3 w-3" />
        Laporkan Tutup
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto md:!inset-auto md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 md:rounded-2xl md:border md:border-bark/10 md:max-w-lg md:w-full">
        <SheetHeader>
          <SheetTitle className="font-display font-bold text-bark">Laporkan Tutup</SheetTitle>
          <SheetDescription>
            Laporkan jika <strong>{providerName}</strong> sudah tidak beroperasi. Laporan akan ditinjau oleh admin sebelum diterapkan.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {submitted ? (
            <div className="text-center py-6 animate-scale-in">
              <CheckCircle className="h-8 w-8 text-sage mx-auto mb-2" />
              <p className="font-display font-bold text-bark">Laporan Terkirim</p>
              <p className="text-sm text-warm-gray mt-1">
                Terima kasih. Admin akan meninjau laporan ini.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">
                  Alasan
                  <span className="ml-1 text-xs font-normal text-warm-gray">(opsional)</span>
                </label>
                <textarea
                  placeholder="Contoh: Tempat sudah tidak ada, nomor tidak aktif..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                variant="destructive"
                className="w-full rounded-xl h-11 font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4" />
                    Kirim Laporan
                  </>
                )}
              </Button>

              <p className="text-[11px] text-warm-gray text-center">
                Laporan akan ditinjau admin. Provider tidak akan langsung dihapus.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
