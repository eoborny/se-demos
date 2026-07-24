import { Link } from "react-router-dom"

// Aubergine → crimson gradient banner carrying the Virgin Voyages wordmark.
export function BrandHeader() {
  return (
    <header className="bg-[linear-gradient(160deg,#1A0525,#2E0A3E_60%,#E10A0A)] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-baseline gap-2 leading-none">
          <span className="font-script text-3xl text-[#FF6B5E]">Virgin</span>
          <span className="font-display text-2xl tracking-tight">Voyages</span>
        </Link>
        <div className="text-right">
          <p className="font-display text-sm tracking-[0.04em] text-white/90">
            Crew Onboarding
          </p>
          <p className="text-xs text-white/60">Hiring &amp; onboarding portal</p>
        </div>
      </div>
    </header>
  )
}
