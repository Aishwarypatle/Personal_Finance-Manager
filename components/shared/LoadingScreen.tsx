import { LoaderCircle } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';

export function LoadingScreen() {
  return (
    <main className="login-screen grid min-h-dvh place-items-center" role="status" aria-live="polite" aria-busy="true">
      <section className="login-card text-center">
        <span className="brand-icon mx-auto"><BrandMark size={23} /></span>
        <h1>Ledger<span className="brand-dot">.</span></h1>
        <LoaderCircle className="mx-auto mt-6 animate-spin text-ledger" size={24} aria-hidden="true" />
        <p className="mt-3">Checking your session…</p>
      </section>
    </main>
  );
}
