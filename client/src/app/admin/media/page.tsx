"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Search,
  Copy,
  Check,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Trash2,
  Info,
  RefreshCw,
} from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

interface MediaItem {
  url: string;
  createdAt: string;
  usage: {
    type: string;
    id?: string;
    title: string;
    slug?: string;
  }[];
}

export default function AdminMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/media`);
      const data: { success: boolean; media: MediaItem[] } = await res.json();
      if (data.success && data.media) {
        setMediaItems(data.media);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load media library.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("fictionfigure_token");
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setMessage("Image uploaded successfully!");
        setMediaItems((prev) => [
          {
            url: data.url,
            createdAt: new Date().toISOString(),
            usage: [{ type: "upload", title: "New Upload" }],
          },
          ...prev,
        ]);
      } else {
        setError(data.error || "Upload failed.");
      }
    } catch (err: any) {
      setError(err.message || "Upload request error.");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const urlMatch = item.url.toLowerCase().includes(q);
    const usageMatch = item.usage.some((u) => u.title.toLowerCase().includes(q) || u.type.toLowerCase().includes(q));
    return urlMatch || usageMatch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E2]">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#6B6B6B] uppercase block">
            STOREFRONT ASSETS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] uppercase font-mono">
            MEDIA LIBRARY
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Manage Cloudinary images, product photography, hero banners, and category assets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMedia}
            className="p-2.5 border border-[#E5E5E2] hover:border-[#111111] bg-white text-[#111111] transition-colors"
            title="Refresh Media Assets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <label className="cursor-pointer px-5 py-2.5 bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{uploading ? "Uploading Image..." : "Upload New Image"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-[#2E6B44]/10 border border-[#2E6B44]/30 text-[#2E6B44] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232]/30 text-[#A83232] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-[#E5E5E2] p-4 flex items-center space-x-3">
        <Search className="w-4 h-4 text-[#6B6B6B]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search media by image URL, product title, category name, or section..."
          className="flex-1 text-xs bg-transparent text-[#111111] focus:outline-none placeholder-[#999999]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-[#6B6B6B] hover:text-[#111111] font-mono"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs font-mono text-[#6B6B6B] flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mb-3 text-[#111111]" />
          <span>Scanning Media Library & Asset References...</span>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white border border-[#E5E5E2] p-16 text-center">
          <ImageIcon className="w-12 h-12 text-[#CCCCCC] mx-auto mb-3" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111] font-mono">
            No Media Assets Found
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-1">
            {searchQuery
              ? "No images match your search term. Try resetting the query."
              : "Upload your first image to populate the media library."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E5E5E2] overflow-hidden group hover:border-[#111111] transition-all flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square bg-[#F7F7F5] overflow-hidden flex items-center justify-center">
                <Image
                  src={item.url}
                  alt="Storefront asset"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(item.url)}
                    className="p-2 bg-white text-[#111111] hover:bg-[#D4AF37] transition-colors"
                    title="Copy Image URL"
                  >
                    {copiedUrl === item.url ? (
                      <Check className="w-4 h-4 text-[#2E6B44]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white text-[#111111] hover:bg-[#D4AF37] transition-colors"
                    title="Open Full Resolution Image"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setDeleteCandidate(item)}
                    className="p-2 bg-white text-[#A83232] hover:bg-[#A83232] hover:text-white transition-colors"
                    title="Inspect Safety & Remove Reference"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Usage Badges Footer */}
              <div className="p-3 border-t border-[#E5E5E2] bg-white flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-[#6B6B6B] block truncate" title={item.url}>
                    {item.url.split("/").pop()}
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {item.usage.map((u, uIdx) => (
                      <span
                        key={uIdx}
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-tight ${
                          u.type === "product"
                            ? "bg-[#111111] text-white"
                            : u.type === "category"
                            ? "bg-[#D4AF37] text-[#111111]"
                            : "bg-[#2E6B44] text-white"
                        }`}
                        title={u.title}
                      >
                        {u.type === "product"
                          ? `Product: ${u.title.substring(0, 12)}...`
                          : u.type === "category"
                          ? `Cat: ${u.title}`
                          : u.title}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#F0F0EE] flex justify-between items-center text-[9px] font-mono text-[#999999]">
                  <span>{item.usage.length} Reference(s)</span>
                  <button
                    onClick={() => copyToClipboard(item.url)}
                    className="text-[#111111] hover:underline font-bold uppercase"
                  >
                    {copiedUrl === item.url ? "COPIED" : "COPY LINK"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete / Safety Warning Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-[#A83232]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#111111]">
                Media Reference Audit Warning
              </h3>
            </div>

            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Before deleting or unlinking an image, verify if it is actively referenced across your storefront catalog.
            </p>

            <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-mono space-y-1">
              <span className="text-[10px] text-[#6B6B6B] uppercase block font-bold">Active References:</span>
              {deleteCandidate.usage.map((u, i) => (
                <div key={i} className="flex items-center space-x-2 text-[#111111]">
                  <Info className="w-3 h-3 text-[#D4AF37]" />
                  <span>
                    [{u.type.toUpperCase()}] {u.title}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#A83232] font-semibold">
              Warning: Removing an image that is actively in use will cause missing artwork on the storefront.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-[#E5E5E2] hover:border-[#111111] text-xs font-bold uppercase tracking-wider text-[#111111]"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
