import { Activity } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#2E3846] bg-[#1A212B]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* ETS wordmark */}
          <div className="flex items-center">
            <span className="rounded-sm bg-[#F2B733] px-2 py-1 text-lg font-bold leading-none tracking-tight text-[#1A212B]">
              ETS
            </span>
          </div>
          <div className="h-8 w-px bg-[#2E3846]" />
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#F2B733]" />
              <h1 className="text-base font-semibold leading-tight text-white">
                Test Center Capacity Monitor
              </h1>
            </div>
            <p className="text-xs text-[#8B93A0]">Test Administration · Operations</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-[#8B93A0] sm:flex">
          <span className="inline-block h-2 w-2 rounded-full bg-[#3F9877]" />
          Live · updated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </header>
  )
}
