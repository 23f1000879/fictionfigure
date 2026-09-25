"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number | null;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  return (
    <div
      className={`
        inline-flex p-1 bg-[#0E0F13] border border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar
        ${className}
      `}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 whitespace-nowrap
              ${
                isActive
                  ? "bg-[#181920] text-[#F5C518] border border-white/10 shadow-md shadow-black/50"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.03]"
              }
            `}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`
                  text-[10px] font-mono px-1.5 py-0.5 rounded-md
                  ${
                    isActive
                      ? "bg-[#F5C518]/15 text-[#F5C518]"
                      : "bg-white/[0.06] text-[#64748B]"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
