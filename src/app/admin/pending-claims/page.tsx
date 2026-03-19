import { Shield, ExternalLink, FileText, User, Flag } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AdminApproveButton } from "@/components/admin-approve-button";
import { AdminClosureButton } from "@/components/admin-closure-button";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { adminDb } from "@/lib/firebase-admin";
import { docToProvider } from "@/lib/providers";
import { CATEGORIES, type Provider, type Recommendation } from "@/lib/types";

interface ClosureReport {
  id: string;
  provider_id: string;
  provider_name: string;
  reason: string | null;
  reported_by_uid: string | null;
  status: string;
  created_at: Date;
}

async function getPendingProviders(): Promise<Provider[]> {
  const results: Provider[] = [];

  // Pending claims
  const claimsSnapshot = await adminDb
    .collection("providers")
    .where("claim_status", "==", "pending")
    .get();
  claimsSnapshot.docs.forEach((doc) => results.push(docToProvider(doc)));

  // Organic registrations (unverified)
  const organicSnapshot = await adminDb
    .collection("providers")
    .where("source", "==", "organic")
    .where("is_verified", "==", false)
    .get();
  organicSnapshot.docs.forEach((doc) => {
    if (!results.some((r) => r.id === doc.id)) {
      results.push(docToProvider(doc));
    }
  });

  return results;
}

async function getPendingClosureReports(): Promise<ClosureReport[]> {
  const snapshot = await adminDb
    .collection("closure_reports")
    .where("status", "==", "pending")
    .orderBy("created_at", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      provider_id: data.provider_id as string,
      provider_name: data.provider_name as string,
      reason: (data.reason as string) || null,
      reported_by_uid: (data.reported_by_uid as string) || null,
      status: data.status as string,
      created_at: data.created_at?.toDate?.() || new Date(),
    };
  });
}

async function getRecommendations(): Promise<Recommendation[]> {
  const snapshot = await adminDb
    .collection("recommendations")
    .orderBy("created_at", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      service_name: data.service_name as string,
      whatsapp: data.whatsapp as string,
      reason: data.reason as string,
      submitted_by_uid: data.submitted_by_uid as string | undefined,
      source: "user_recommendation" as const,
      created_at: data.created_at?.toDate?.() || new Date(),
    };
  });
}

export default async function AdminPendingClaimsPage() {
  let providers: Provider[] = [];
  let recommendations: Recommendation[] = [];
  let closureReports: ClosureReport[] = [];

  try {
    [providers, recommendations, closureReports] = await Promise.all([
      getPendingProviders(),
      getRecommendations(),
      getPendingClosureReports(),
    ]);
  } catch (err) {
    console.error("Admin fetch error:", err);
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          <AdminAuthGate>
            <div className="animate-fade-up flex items-center gap-2">
              <div className="w-10 h-10 bg-bark rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-xl text-bark">Admin Dashboard</h1>
                <p className="text-xs text-warm-gray">Kelola klaim & pendaftaran mitra</p>
              </div>
            </div>

            {/* Pending Providers */}
            <section className="animate-fade-up stagger-1 space-y-3">
              <h2 className="font-display font-bold text-bark">
                Menunggu Persetujuan
                <span className="ml-2 text-xs font-medium text-warm-gray bg-cream-dark px-2 py-0.5 rounded-full">
                  {providers.length}
                </span>
              </h2>

              {providers.length === 0 ? (
                <div className="bg-white rounded-xl border border-bark/5 p-6 text-center">
                  <p className="text-sm text-warm-gray">Tidak ada yang menunggu persetujuan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {providers.map((provider) => {
                    const category = CATEGORIES.find((c) => c.value === provider.category);
                    return (
                      <div key={provider.id} className="bg-white rounded-xl border border-bark/5 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/providers/${provider.id}`}
                              className="font-display font-bold text-sm text-bark hover:text-terracotta transition-colors inline-flex items-center gap-1"
                            >
                              {provider.name}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-warm-gray">{category?.emoji} {category?.label}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-cream-dark text-bark-light font-medium">
                                {provider.source === "organic" ? "Pendaftaran Baru" : "Klaim Profil"}
                              </span>
                            </div>
                          </div>
                          <AdminApproveButton
                            providerId={provider.id}
                            claimantUid={provider.claimant_uid}
                          />
                        </div>

                        {/* Claim proof */}
                        {(provider.claim_proof_text || provider.claim_proof_url) && (
                          <div className="bg-cream rounded-lg p-3 space-y-1">
                            <p className="text-xs font-semibold text-bark flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Bukti Klaim
                            </p>
                            {provider.claim_proof_text && (
                              <p className="text-xs text-warm-gray">{provider.claim_proof_text}</p>
                            )}
                            {provider.claim_proof_url && (
                              <a
                                href={provider.claim_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-terracotta hover:underline inline-flex items-center gap-1"
                              >
                                Lihat dokumen <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-3 text-[10px] text-warm-gray">
                          {provider.claimant_uid && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {provider.claimant_uid.slice(0, 8)}...
                            </span>
                          )}
                          <span>{provider.address}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Closure Reports */}
            <section className="animate-fade-up stagger-2 space-y-3">
              <h2 className="font-display font-bold text-bark">
                Laporan Tutup
                <span className="ml-2 text-xs font-medium text-warm-gray bg-cream-dark px-2 py-0.5 rounded-full">
                  {closureReports.length}
                </span>
              </h2>

              {closureReports.length === 0 ? (
                <div className="bg-white rounded-xl border border-bark/5 p-6 text-center">
                  <p className="text-sm text-warm-gray">Tidak ada laporan tutup.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closureReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl border border-bark/5 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/providers/${report.provider_id}`}
                            className="font-display font-bold text-sm text-bark hover:text-terracotta transition-colors inline-flex items-center gap-1"
                          >
                            {report.provider_name}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium inline-flex items-center gap-1">
                              <Flag className="h-3 w-3" /> Dilaporkan Tutup
                            </span>
                          </div>
                        </div>
                        <AdminClosureButton
                          reportId={report.id}
                          providerId={report.provider_id}
                        />
                      </div>
                      {report.reason && (
                        <p className="text-xs text-warm-gray italic">&ldquo;{report.reason}&rdquo;</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-warm-gray">
                        {report.reported_by_uid && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {report.reported_by_uid.slice(0, 8)}...
                          </span>
                        )}
                        <span>
                          {report.created_at.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recommendations */}
            <section className="animate-fade-up stagger-3 space-y-3">
              <h2 className="font-display font-bold text-bark">
                Rekomendasi Warga
                <span className="ml-2 text-xs font-medium text-warm-gray bg-cream-dark px-2 py-0.5 rounded-full">
                  {recommendations.length}
                </span>
              </h2>

              {recommendations.length === 0 ? (
                <div className="bg-white rounded-xl border border-bark/5 p-6 text-center">
                  <p className="text-sm text-warm-gray">Belum ada rekomendasi.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-white rounded-xl border border-bark/5 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display font-bold text-sm text-bark">{rec.service_name}</p>
                          <p className="text-xs text-warm-gray mt-0.5">WA: {rec.whatsapp}</p>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-paw-pink-light text-terracotta font-medium shrink-0">
                          Rekomendasi
                        </span>
                      </div>
                      <p className="text-xs text-warm-gray italic">&ldquo;{rec.reason}&rdquo;</p>
                      <p className="text-[10px] text-warm-gray/60">
                        {rec.created_at.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </AdminAuthGate>
        </div>
      </main>
    </>
  );
}
