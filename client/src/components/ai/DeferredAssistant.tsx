"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const launcherClass = "sakuga-concierge fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 p-2.5 sm:p-3.5 bg-white/95 dark:bg-[#111318]/95 backdrop-blur text-white border border-white/15 rounded-[10px] shadow-2xl hover:border-[#F5C518]/60 transition-all duration-200 flex items-center space-x-2 border border-white/[0.08] rounded-none";

function AssistantLauncher({ loading = false, onClick }: { loading?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} onPointerEnter={() => { void import("./AIChatWidget").catch(() => {}); }} onFocus={() => { void import("./AIChatWidget").catch(() => {}); }} disabled={loading} aria-busy={loading} aria-label="Open Shopping Assistant" className={launcherClass}>
    {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#D4AF37]" /> : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />}
    <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Store Concierge</span>
  </button>;
}

const Assistant = dynamic(() => import("./AIChatWidget").then(module => module.AIChatWidget), { ssr: false, loading: () => <AssistantLauncher loading /> });

export function DeferredAssistant() {
  const [opened, setOpened] = useState(false);
  return opened ? <Assistant initialOpen /> : <AssistantLauncher onClick={() => setOpened(true)} />;
}
