"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
} from "lucide-react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  where as firestoreWhere,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { Button } from "@/components/ui/button";
import { TIER_DEFS, type ProviderTier } from "@/lib/tiers";
import type { SubscriptionOrderStatus } from "@/lib/types";

interface OrderItem {
  id: string;
  order_code: string;
  provider_id: string;
  provider_name: string;
  tier: ProviderTier;
  amount: number;
  unique_code: number;
  total: number;
  status: SubscriptionOrderStatus;
  duration_days: number;
  created_at: Date;
}

const STATUS_LABELS: Record<
  SubscriptionOrderStatus,
  { label: string; color: string }
> = {
  pending: { label: "Menunggu Bayar", color: "bg-amber-100 text-amber-700" },
  waiting_verification: {
    label: "Verifikasi",
    color: "bg-blue-100 text-blue-700",
  },
  active: { label: "Aktif", color: "bg-sage/15 text-sage" },
  expired: { label: "Kadaluarsa", color: "bg-bark/10 text-bark-light" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-600" },
};

export default function SubscriptionOrdersPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <AdminAuthGate>
        <OrdersList />
      </AdminAuthGate>
    </div>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const q = query(
          collection(db, "subscription_orders"),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(q);
        setOrders(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              order_code: data.order_code as string,
              provider_id: data.provider_id as string,
              provider_name: data.provider_name as string,
              tier: data.tier as ProviderTier,
              amount: data.amount as number,
              unique_code: data.unique_code as number,
              total: data.total as number,
              status: data.status as SubscriptionOrderStatus,
              duration_days: (data.duration_days as number) || 30,
              created_at: data.created_at?.toDate() || new Date(),
            };
          })
        );
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
      setLoading(false);
    }

    fetchOrders();
  }, []);

  async function handleApprove(order: OrderItem) {
    try {
      // Update order status
      await updateDoc(doc(db, "subscription_orders", order.id), {
        status: "active" as SubscriptionOrderStatus,
        payment_confirmed_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Update provider subscription
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + order.duration_days);

      const tierDef = TIER_DEFS[order.tier];
      await updateDoc(doc(db, "providers", order.provider_id), {
        tier: order.tier,
        is_premium: true,
        premium_until: premiumUntil,
        tier_rank: tierDef.searchRank,
        features_enabled: {
          booking: true,
          payments: order.tier === "business",
          crm: order.tier === "business",
        },
        updated_at: serverTimestamp(),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: "active" } : o
        )
      );
    } catch (err) {
      console.error("Approve error:", err);
      alert("Gagal memproses. Silakan coba lagi.");
    }
  }

  async function handleReject(orderId: string) {
    try {
      await updateDoc(doc(db, "subscription_orders", orderId), {
        status: "rejected" as SubscriptionOrderStatus,
        updated_at: serverTimestamp(),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "rejected" } : o
        )
      );
    } catch (err) {
      console.error("Reject error:", err);
      alert("Gagal memproses.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
      </div>
    );
  }

  const pending = orders.filter(
    (o) => o.status === "pending" || o.status === "waiting_verification"
  );
  const rest = orders.filter(
    (o) => o.status !== "pending" && o.status !== "waiting_verification"
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/pending-claims"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lavender/15 flex items-center justify-center">
          <Crown className="h-5 w-5 text-lavender" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg text-bark">
            Pesanan Langganan
          </h1>
          <p className="text-xs text-warm-gray">
            {orders.length} total pesanan
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center">
          <Clock className="h-8 w-8 text-warm-gray/30 mx-auto mb-2" />
          <p className="text-sm text-warm-gray">Belum ada pesanan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-sm text-bark">
                Perlu Verifikasi ({pending.length})
              </h2>
              {pending.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onApprove={() => handleApprove(order)}
                  onReject={() => handleReject(order.id)}
                />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-sm text-warm-gray">
                Riwayat ({rest.length})
              </h2>
              {rest.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onApprove,
  onReject,
}: {
  order: OrderItem;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const statusDef = STATUS_LABELS[order.status];
  const tierDef = TIER_DEFS[order.tier];

  return (
    <div className="bg-white rounded-xl border border-bark/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusDef.color}`}
        >
          {statusDef.label}
        </span>
        <span className="text-[10px] text-warm-gray">
          {order.created_at.toLocaleDateString("id-ID")}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-cream/60 rounded-lg px-3 py-2">
        <span className="text-[10px] text-warm-gray">Kode:</span>
        <span className="font-mono font-bold text-sm text-bark">
          {order.order_code}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(order.order_code)}
          className="ml-auto p-1 rounded hover:bg-bark/5"
        >
          <Copy className="h-3 w-3 text-warm-gray" />
        </button>
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-sm text-bark">
          {order.provider_name}
        </p>
        <p className="text-xs text-warm-gray">
          Paket{" "}
          <span className="font-semibold text-terracotta">
            {tierDef.name}
          </span>{" "}
          — {order.duration_days} hari
        </p>
      </div>

      <div className="bg-cream rounded-lg p-3 text-center">
        <p className="text-[10px] text-warm-gray">Total Transfer</p>
        <p className="font-mono font-extrabold text-lg text-bark">
          Rp {order.total.toLocaleString("id-ID")}
        </p>
        <p className="text-[10px] text-warm-gray">
          {tierDef.priceLabel} + kode unik Rp {order.unique_code}
        </p>
      </div>

      {(order.status === "pending" ||
        order.status === "waiting_verification") &&
        onApprove &&
        onReject && (
          <div className="flex gap-2 pt-1">
            <Button
              onClick={onApprove}
              className="flex-1 bg-sage hover:bg-sage/80 text-white rounded-lg h-8 text-xs"
              size="sm"
            >
              <CheckCircle className="h-3 w-3" />
              Aktifkan
            </Button>
            <Button
              onClick={onReject}
              variant="destructive"
              className="rounded-lg h-8 text-xs"
              size="sm"
            >
              <XCircle className="h-3 w-3" /> Tolak
            </Button>
          </div>
        )}
    </div>
  );
}
