"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

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
    inStock?: boolean;
    variants?: { inventoryCount: number }[];
  }[];
}

function extractMaxPrice(text: string): number | null {
  const t = text.toLowerCase();
  const regex = /(?:under|below|less than|around|rs\.?|₹|max(?:imum)?)\s*(\d+)(k)?\b/i;
  const match = t.match(regex);
  if (match) {
    let val = parseInt(match[1], 10);
    const suffix = match[2];
    if (suffix && suffix.toLowerCase() === 'k') {
      val *= 1000;
    }
    return val;
  }
  const kRegex = /\b(\d+)k\b/i;
  const kMatch = t.match(kRegex);
  if (kMatch) {
    return parseInt(kMatch[1], 10) * 1000;
  }
  const simpleUnderRegex = /under\s*(?:₹|rs\.?)?\s*(\d+)/i;
  const simpleUnderMatch = t.match(simpleUnderRegex);
  if (simpleUnderMatch) {
    return parseInt(simpleUnderMatch[1], 10);
  }
  const belowRegex = /below\s*(?:₹|rs\.?)?\s*(\d+)/i;
  const belowMatch = t.match(belowRegex);
  if (belowMatch) {
    return parseInt(belowMatch[1], 10);
  }
  return null;
}

function extractOrderNumber(text: string): string | null {
  const match = text.match(/\b(FF-\d+(?:-\d+)?)\b/i);
  if (match) {
    return match[1].toUpperCase();
  }
  const hashMatch = text.match(/#\s*(FF-\d+(?:-\d+)?)\b/i);
  if (hashMatch) {
    return hashMatch[1].toUpperCase();
  }
  return null;
}

function getCleanSearchQuery(text: string): string {
  let query = text.toLowerCase();
  query = query.replace(/(?:under|below|less than|around|rs\.?|₹)\s*\d+(?:k)?\b/gi, "");
  query = query.replace(/\b\d+k\b/gi, "");
  query = query.replace(/\b\d+\b/g, "");
  query = query.replace(/\b(in stock|available|stock|show products in stock|what figures are available|is this in stock)\b/gi, "");
  query = query.replace(/\b(show me|show|search for|search|do you have|do you sell|find|find me|give me|recommend|cheapest|cheap|cheapest figures|figures|figure|collectibles|collectible|keychains|keychain|products|product|items|item|figures|collection|anime)\b/gi, "");
  query = query.trim().replace(/\s+/g, " ");
  return query;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      sender: "ASSISTANT",
      content: "Hello collector. I am the FictionFigure Store Concierge. I can help you search our catalog of authentic figures, check your order status, or explain our shipping and return policies. What are you looking for today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [storeMeta, setStoreMeta] = useState<{
    categories: any[];
    brands: string[];
    franchises: string[];
  }>({ categories: [], brands: [], franchises: [] });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Pre-load store metadata dynamically to guide local intent matching
    fetch(`${API_BASE}/products?limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setStoreMeta({
            categories: data.categories || [],
            brands: data.brands || [],
            franchises: data.franchises || [],
          });
        }
      })
      .catch(() => {});
  }, []);

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
      const lowerQuery = query.toLowerCase();

      // INTENT 1: ORDER TRACKING OR STATUS QUERY
      const isOrderQuery = /\border\b|\btrack\b|\bstatus\b/i.test(lowerQuery);
      const orderNum = extractOrderNumber(query);

      if (orderNum) {
        // Fetch specific order details
        const token = localStorage.getItem("fictionfigure_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/orders/${orderNum}`, { headers });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.order) {
            const order = data.order;
            const itemsList = order.items.map((item: any) => `- ${item.title} (x${item.quantity})`).join("\n");
            const trackingStr = order.trackingNumber 
              ? `Tracking Number: **${order.trackingNumber}** (${order.shippingMethod || "Standard Shipping"})`
              : "Tracking Number: *Pending dispatch verification*";

            const botContent = `Order **${order.orderNumber}** details:
* **Date Placed**: ${new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
* **Order Status**: **${order.status}**
* **Total Value**: ${formatPrice(order.totalAmount)}
* **Payment Status**: ${order.payments?.[0]?.status || "PENDING"}
* **Delivery Destination**: ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}
* **Shipping Status**: ${trackingStr}

**Items Ordered**:
${itemsList}`;

            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "ASSISTANT",
                content: botContent,
                type: "TEXT"
              }
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "ASSISTANT",
                content: `I couldn't locate order **${orderNum}** in our catalog database. Please verify your order number and make sure you are logged in.`,
                type: "TEXT"
              }
            ]);
          }
        } else {
          if (res.status === 401) {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "ASSISTANT",
                content: `I see you are attempting to check order **${orderNum}**. Access is restricted—please sign in to your FictionFigure account to view this order details.`,
                type: "TEXT"
              }
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "ASSISTANT",
                content: `I couldn't retrieve your order information right now. Please check your Orders section in your profile.`,
                type: "TEXT"
              }
            ]);
          }
        }
        setIsLoading(false);
        return;
      } else if (isOrderQuery) {
        // General order status query (check recent orders)
        const token = localStorage.getItem("fictionfigure_token");
        if (!token) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "ASSISTANT",
              content: `To check your orders, please sign in to your account, or search for a specific reference (e.g. "track #FF-1001").`,
              type: "TEXT"
            }
          ]);
          setIsLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_BASE}/orders/my-orders`, { headers });
        if (res.ok) {
          const data = await res.json();
          const orders = data.orders || [];
          if (orders.length > 0) {
            const listStr = orders.map((o: any) => {
              const dt = new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "short" });
              return `- **${o.orderNumber}** (${dt}) • **${o.status}** • ${formatPrice(o.totalAmount)} [${o.firstItemTitle}]`;
            }).join("\n");
            
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "ASSISTANT",
                content: `Here are your recent orders:\n${listStr}\n\nTo view tracking info or deep details, type: "track [Order Number]" (e.g. "track ${orders[0].orderNumber}")`,
                type: "TEXT"
              }
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "ASSISTANT",
                content: "I couldn't find any orders placed under your account on FictionFigure.",
                type: "TEXT"
              }
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "ASSISTANT",
              content: "I couldn't retrieve your order information right now. Please check your Orders section in your profile.",
              type: "TEXT"
            }
          ]);
        }
        setIsLoading(false);
        return;
      }

      // INTENT 2: SHIPPING/DELIVERY POLICIES
      const isShippingQuery = /\bshipping\b|\bdelivery\b|\bdeliver\b|\bdispatch\b|\bcarrier\b|\bcoverage\b/i.test(lowerQuery);
      if (isShippingQuery) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "ASSISTANT",
            content: `**Shipping & Delivery Information**:
* **Dispatch Location**: All orders are dispatched from our facility in Bikaner, Rajasthan.
* **Delivery Coverage**: Pan-India delivery via national courier networks. 
* **Timeline**: Standard order payment/address verification and dispatch processing takes **1 to 3 business days**. Regional delivery transit takes additional time depending on distance from Rajasthan.
* **Shipping Charges**: Calculated and displayed clearly during checkout. Enjoy **FREE shipping** on all orders of **₹500** or more.
* **Outer Protection**: Scale figures and statues are carefully packed with outer layering to protect original art boxes during transit.`,
            type: "TEXT"
          }
        ]);
        setIsLoading(false);
        return;
      }

      // INTENT 3: RETURN/REPLACEMENT POLICIES
      const isReturnQuery = /\breturn\b|\breplacement\b|\brefund\b|\bcancel\b|\bcancellation\b/i.test(lowerQuery);
      if (isReturnQuery) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "ASSISTANT",
            content: `**Returns & Replacements Guidelines**:
* **Replacement Window**: Transit damage, missing parts, or incorrect shipments must be reported within **48 hours** of delivery.
* **Art Box Protection**: Items must be kept in their original packaging with all included accessories and art box components intact.
* **Verification Proof**: An unboxing video or photographs of the outer shipping box and delivered contents may be requested.
* **Cancellation**: Orders can be canceled prior to dispatch by contacting support. Dispatched packages cannot be canceled.
* **Opened Items**: Due to the delicate nature of scale collectibles, opened, assembled, or post-delivery handled figures are non-returnable unless a verified manufacturing defect exists.
* **Support Helpline**: Reach us at **+91 97974 94639** (Mon - Sat, 10:00 AM - 7:00 PM IST) or via email: **support@fictionfigure.in**.`,
            type: "TEXT"
          }
        ]);
        setIsLoading(false);
        return;
      }

      // INTENT 4: PRODUCT SEARCH & PRICE FILTERING
      const maxPrice = extractMaxPrice(query);
      const isStockQuery = /\bin stock\b|\bavailable\b|\bstock\b/i.test(lowerQuery);
      const isCheapQuery = /\bcheapest\b|\bcheap\b/i.test(lowerQuery);
      const cleanKeyword = getCleanSearchQuery(query);

      let apiParams = new URLSearchParams();
      if (cleanKeyword) {
        apiParams.append("query", cleanKeyword);
      }
      if (maxPrice !== null) {
        apiParams.append("maxPrice", String(maxPrice));
      }
      if (isStockQuery) {
        apiParams.append("inStockOnly", "true");
      }
      if (isCheapQuery) {
        apiParams.append("sortBy", "price-asc");
      }
      apiParams.append("limit", "5");

      // Dynamic checks from storeMeta cached list
      const matchedCategory = storeMeta.categories.find(c => 
        query.toLowerCase().includes(c.name.toLowerCase()) || 
        query.toLowerCase().includes(c.slug.toLowerCase())
      );
      if (matchedCategory) {
        apiParams.append("category", matchedCategory.id);
      }

      const matchedFranchise = storeMeta.franchises.find(f => 
        query.toLowerCase().includes(f.toLowerCase())
      );
      if (matchedFranchise) {
        apiParams.append("franchise", matchedFranchise);
      }

      const matchedBrand = storeMeta.brands.find(b => 
        query.toLowerCase().includes(b.toLowerCase())
      );
      if (matchedBrand) {
        apiParams.append("brand", matchedBrand);
      }

      const res = await fetch(`${API_BASE}/products?${apiParams.toString()}`);
      const data = await res.json();
      const products = data.products || [];

      if (products.length > 0) {
        let msgText = `Here are the matching collectibles from our live catalog:`;
        if (maxPrice !== null) {
          msgText = `Here are the collectibles under ₹${maxPrice} matching your search:`;
        }
        
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "ASSISTANT",
            content: msgText,
            type: "PRODUCT_RECOMMENDATIONS",
            products: products
          }
        ]);
      } else {
        // Fallback for unknown questions
        const isGeneralGibberish = cleanKeyword.length > 0 && !matchedCategory && !matchedFranchise && !matchedBrand && products.length === 0;
        
        if (isGeneralGibberish) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "ASSISTANT",
              content: `I'm currently focused on helping you discover FictionFigure products, availability, pricing, and store information. Try asking me about a figure, collection, price range, or order.`,
              type: "TEXT"
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "ASSISTANT",
              content: `I couldn't locate any collectibles matching "${query}" in our live catalog. Try searching for a different character, category, or checking our filters.`,
              type: "TEXT"
            }
          ]);
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ASSISTANT",
          content: "I'm unable to load the catalog right now. Please try again or browse the Shop page.",
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
        aria-label="Open Shopping Assistant"
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
          Store Concierge
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
                <h4 className="text-xs font-bold uppercase tracking-wider">FictionFigure Store Concierge</h4>
                <span className="text-[10px] text-white/70 block">Live Store & Catalog Assistant</span>
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
                      {msg.products.map((p) => {
                        const inStock = p.inStock ?? (p.variants && p.variants.length > 0 ? p.variants[0].inventoryCount > 0 : false);
                        return (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-[#E5E5E2] hover:border-[#111111] transition-all duration-200 group gap-3"
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="relative w-12 h-12 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2] overflow-hidden">
                                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] uppercase font-bold text-[#6B6B6B] block">{p.brand}</span>
                                <h5 className="text-[11px] font-semibold text-[#111111] truncate group-hover:underline">{p.name}</h5>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className="text-[11px] font-mono font-bold text-[#111111]">{formatPrice(p.price)}</span>
                                  <span className="text-[9px] font-bold">
                                    {inStock ? (
                                      <span className="text-[#2E6B44]">In Stock</span>
                                    ) : (
                                      <span className="text-[#A83232]">Out of Stock</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2.5 py-1 bg-[#111111] text-white text-[9px] font-bold uppercase tracking-wider group-hover:bg-black transition-colors block sm:inline-block">
                                View Product
                              </span>
                            </div>
                          </Link>
                        );
                      })}
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
                <span>Consulting live store catalog...</span>
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
