"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Link as LinkIcon, Loader2, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ProductImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  required?: boolean;
}

export function ProductImageUploader({
  label,
  value,
  onChange,
  onUploadingChange,
  required = false,
}: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [containerFocused, setContainerFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifyUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    if (onUploadingChange) onUploadingChange(uploading);
  };

  const uploadFile = async (file: File) => {
    setErrorMessage("");

    // 1. Validate File Size (5 MB Max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size exceeds 5 MB limit. Please select a smaller image.");
      return;
    }

    // 2. Validate MIME Type / Extension
    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const validExts = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExt = "." + (file.name.split(".").pop() || "").toLowerCase();

    if (!validMimeTypes.includes(file.type) && !validExts.includes(fileExt)) {
      setErrorMessage("Unsupported format. Please upload JPG, PNG, or WEBP images only.");
      return;
    }

    notifyUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/admin/uploads/product-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image.");

      if (data.url) {
        onChange(data.url);
      } else {
        throw new Error("No image URL returned from upload server.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
    } finally {
      notifyUploading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  };

  // Clipboard Paste (Ctrl+V) Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!containerFocused) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            uploadFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [containerFocused]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setContainerFocused(true)}
      onBlur={() => setContainerFocused(false)}
      className="space-y-2 outline-none"
    >
      <div className="flex justify-between items-center text-xs">
        <label className="font-semibold uppercase tracking-wider text-[#6B6B6B]">
          {label} {required && <span className="text-[#A83232]">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            setUseUrlInput(!useUrlInput);
            setErrorMessage("");
          }}
          className="text-[11px] font-semibold text-[#111111] hover:underline flex items-center"
        >
          {useUrlInput ? (
            <>
              <UploadCloud className="w-3 h-3 mr-1" /> Switch to File Upload
            </>
          ) : (
            <>
              <LinkIcon className="w-3 h-3 mr-1" /> Use Hosted Image URL Instead
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {value ? (
        // PREVIEW CARD WITH REPLACE & REMOVE ACTIONS
        <div className="relative bg-white border border-[#E5E5E2] p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 bg-[#F7F7F5] border border-[#E5E5E2] flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img src={value} alt={label} className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-xs">
            <div className="font-mono text-[11px] text-[#6B6B6B] truncate bg-[#F7F7F5] p-2 border border-[#E5E5E2]">
              {value}
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (useUrlInput) {
                    onChange("");
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isUploading}
                className="px-3 py-1.5 border border-[#E5E5E2] hover:border-[#111111] font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={() => onChange("")}
                disabled={isUploading}
                className="px-3 py-1.5 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : useUrlInput ? (
        // HOSTED URL INPUT FALLBACK
        <div className="space-y-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
          />
        </div>
      ) : (
        // INTERACTIVE UPLOAD DROPZONE
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer p-8 bg-white border-2 border-dashed transition-all text-center space-y-3 ${
            isDragging
              ? "border-[#111111] bg-[#F7F7F5]"
              : containerFocused
              ? "border-[#111111] bg-white"
              : "border-[#E5E5E2] hover:border-[#111111] bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="py-4 space-y-2 text-xs text-[#6B6B6B]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#111111]" />
              <p className="font-semibold text-[#111111]">Uploading product image...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 mx-auto rounded-full bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#111111]">
                <UploadCloud className="w-5 h-5" />
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-semibold text-[#111111]">
                  Upload {label.toLowerCase()}
                </p>
                <p className="text-[#6B6B6B]">
                  Drag & drop image file or <span className="text-[#111111] font-semibold underline">click to browse</span>
                </p>
                <p className="text-[11px] text-[#6B6B6B] font-mono">
                  You can also paste from clipboard (Ctrl+V)
                </p>
              </div>

              <div className="text-[10px] text-[#6B6B6B] uppercase tracking-wider font-semibold">
                JPG, PNG, WEBP • Max file size 5 MB
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
