import { Header } from "@/components/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="max-w-2xl mx-auto px-5 py-6">
          {children}
        </div>
      </main>
    </>
  );
}
