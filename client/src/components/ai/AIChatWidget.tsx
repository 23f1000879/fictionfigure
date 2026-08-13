"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface ChatMsg {
  id: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  type?: "TEXT" | "PRODUCT_RECOMMENDATIONS" | "ORDER_STATUS";
  products?: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    price: number;
    imageUrl?: string;
    inStock: boolean;
  }[];
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      sender: "ASSISTANT",
      content: "Hello collector. I am the FictionFigure AI Concierge. How can I help you find figures, check order status, or explain our curation policies today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMsg = {
      id: `usr-${Date.now()}`,
      sender: "USER",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();

      const botMsg: ChatMsg = {
        id: `bot-${Date.now()}`,
        sender: "ASSISTANT",
        content: data.reply || "I am currently unable to process your request.",
        type: data.type,
        products: data.products,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ASSISTANT",
          content: "Apologies, I encountered a temporary connection issue. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-[#111111] text-white shadow-2xl hover:bg-black transition-all duration-200 flex items-center space-x-2 border border-[#E5E5E2]"
        aria-label="Open AI Shopping Assistant"
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
          AI Concierge
        </span>
      </button>

      {/* Chat Drawer Overlay */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[520px] bg-[#F7F7F5] border border-[#E5E5E2] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="p-4 bg-[#111111] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">FictionFigure AI Concierge</h4>
                <span className="text-[10px] text-white/70 block">Grounded in Live Catalog Data</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ASSISTANT" && (
                  <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`p-3 border ${
                      msg.sender === "USER"
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#111111] border-[#E5E5E2]"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Render Product Recommendations if present */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 p-2 bg-white border border-[#E5E5E2] hover:border-[#111111] transition-colors group"
                        >
                          <div className="relative w-12 h-12 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2]">
                            {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] uppercase font-bold text-[#6B6B6B] block">{p.brand}</span>
                            <h5 className="text-[11px] font-semibold text-[#111111] truncate group-hover:underline">{p.name}</h5>
                            <span className="text-[11px] font-mono font-bold text-[#111111] block mt-0.5">{formatPrice(p.price)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === "USER" && (
                  <div className="w-6 h-6 rounded-full bg-[#E5E5E2] text-[#111111] flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-[#6B6B6B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
                <span>Searching catalog and verifying policies...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2 bg-white border-t border-[#E5E5E2] flex space-x-2 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend("Recommend anime figures under ₹10,000")}
              className="px-2.5 py-1 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] text-[#111111] whitespace-nowrap font-medium"
            >
              Anime figures under ₹10k
            </button>
            <button
              onClick={() => handleSend("Where is my order #FF-1001?")}
              className="px-2.5 py-1 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] text-[#111111] whitespace-nowrap font-medium"
            >
              Track #FF-1001
            </button>
            <button
              onClick={() => handleSend("What is your return policy?")}
              className="px-2.5 py-1 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] text-[#111111] whitespace-nowrap font-medium"
            >
              Return policy
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#E5E5E2] flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about figures, orders, policies..."
              className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-[#111111] text-white hover:bg-black disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
