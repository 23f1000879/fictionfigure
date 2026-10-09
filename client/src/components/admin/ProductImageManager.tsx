"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Star,
  UploadCloud,
  X,
} from "lucide-react";
import { API_BASE, getAdminAuthHeader } from "@/lib/api";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_PRODUCT_IMAGES,
  addImageUrls,
  fileFingerprint,
  makePrimary,
  moveImage,
  planUploads,
  removeImageAt,
  replaceImageAt,
  validateImageFile,
} from "@/lib/productImages";

interface ProductImageManagerProps {
  /** Ordered image URLs; index 0 is the cover/primary image. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** True while any upload is in flight (the form disables saving meanwhile). */
  onBusyChange?: (busy: boolean) => void;
  max?: number;
}

interface PendingUpload {
  id: string;
  file: File;
  name: string;
  preview: string;
  progress: number;
  status: "queued" | "uploading" | "error";
  error?: string;
  /** URL of the gallery image this upload replaces (replace flow), if any. */
  replaces?: string;
}

/** Uploads one file through the existing authenticated backend route, reporting progress. */
function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/admin/uploads/product-image`);
    Object.entries(getAdminAuthHeader()).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status === 401 || xhr.status === 403) return reject(new Error("Your admin session expired. Sign in again in another tab, then retry."));
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(data.error || `Upload failed (${xhr.status}).`));
      if (!data.url) return reject(new Error("The server did not return an image URL."));
      onProgress(100);
      resolve(data.url as string);
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    const form = new FormData();
    form.append("image", file, file.name || "pasted-image.png");
    xhr.send(form);
  });
}

export function ProductImageManager({ value, onChange, onBusyChange, max = MAX_PRODUCT_IMAGES }: ProductImageManagerProps) {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  // Latest list, so sequential uploads never append to a stale copy.
  const valueRef = useRef(value);
  valueRef.current = value;
  const commit = useCallback(
    (next: string[]) => {
      valueRef.current = next;
      onChange(next);
    },
    [onChange]
  );

  // Same file picked twice in one session → reuse its URL instead of uploading again.
  const uploadedByFingerprint = useRef(new Map<string, string>());
  const queueRunning = useRef(false);
  const queueRef = useRef<PendingUpload[]>([]);

  const busy = pending.some((p) => p.status === "queued" || p.status === "uploading");
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  // Release preview object URLs on unmount.
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const patchPending = (id: string, patch: Partial<PendingUpload>) =>
    setPending((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const finishPending = (id: string) =>
    setPending((list) => {
      const item = list.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return list.filter((p) => p.id !== id);
    });

  /** Uploads queued files one at a time so the gallery keeps the order they were picked in. */
  const runQueue = useCallback(async () => {
    if (queueRunning.current) return;
    queueRunning.current = true;
    while (queueRef.current.length > 0) {
      const job = queueRef.current.shift()!;
      patchPending(job.id, { status: "uploading", progress: 0, error: undefined });
      try {
        const fp = fileFingerprint(job.file);
        const url = uploadedByFingerprint.current.get(fp) ?? (await uploadWithProgress(job.file, (pct) => patchPending(job.id, { progress: pct })));
        uploadedByFingerprint.current.set(fp, url);

        if (job.replaces) {
          const idx = valueRef.current.indexOf(job.replaces);
          commit(idx === -1 ? addImageUrls(valueRef.current, [url], max) : replaceImageAt(valueRef.current, idx, url));
        } else if (valueRef.current.includes(url)) {
          setNotices((n) => [...n, `${job.name} is already in the gallery.`]);
        } else if (valueRef.current.length >= max) {
          setNotices((n) => [...n, `${job.name} was not added: the gallery is full (${max} images).`]);
        } else {
          commit(addImageUrls(valueRef.current, [url], max));
        }
        setAnnouncement(`${job.name} uploaded.`);
        finishPending(job.id);
      } catch (err: any) {
        patchPending(job.id, { status: "error", error: err?.message || "Upload failed." });
        setAnnouncement(`${job.name} failed to upload.`);
      }
    }
    queueRunning.current = false;
  }, [commit, max]);

  const enqueue = (files: File[], replaces?: string) => {
    const reserved = pending.filter((p) => !p.replaces).length;
    const slotsLeft = replaces ? 1 : Math.max(0, max - valueRef.current.length - reserved);
    const { accepted, errors } = planUploads(files, slotsLeft);
    if (errors.length) setNotices((n) => [...n, ...errors]);
    if (!accepted.length) return;

    const jobs: PendingUpload[] = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name || "Pasted image",
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "queued",
      replaces,
    }));
    setPending((list) => [...list, ...jobs]);
    queueRef.current.push(...jobs);
    void runQueue();
  };

  const retry = (job: PendingUpload) => {
    patchPending(job.id, { status: "queued", error: undefined, progress: 0 });
    queueRef.current.push({ ...job, status: "queued" });
    void runQueue();
  };

  /* ---------- input sources ---------- */

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    enqueue(files);
  };

  const onReplacePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = replaceTargetRef.current;
    replaceTargetRef.current = null;
    if (!file || !target) return;
    const err = validateImageFile(file);
    if (err) return setNotices((n) => [...n, err]);
    enqueue([file], target);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (dragIndex !== null) return; // tile reorder, handled per tile
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) enqueue(files);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    enqueue(files);
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!/^https:\/\/\S+$/i.test(url)) return setNotices((n) => [...n, "Enter a full https:// image URL."]);
    if (valueRef.current.includes(url)) return setNotices((n) => [...n, "That image is already in the gallery."]);
    if (valueRef.current.length >= max) return setNotices((n) => [...n, `The gallery is full (${max} images).`]);
    commit(addImageUrls(valueRef.current, [url], max));
    setUrlDraft("");
    setShowUrlInput(false);
  };

  /* ---------- gallery actions ---------- */

  const move = (from: number, to: number) => {
    commit(moveImage(valueRef.current, from, to));
    setAnnouncement(`Image moved to position ${to + 1}.`);
  };
  const setCover = (idx: number) => {
    commit(makePrimary(valueRef.current, idx));
    setAnnouncement(`Image ${idx + 1} is now the cover image.`);
  };
  const remove = (idx: number) => {
    commit(removeImageAt(valueRef.current, idx));
    setAnnouncement(`Image ${idx + 1} removed from the gallery. It is only removed from the product when you save.`);
  };
  const startReplace = (url: string) => {
    replaceTargetRef.current = url;
    replaceInputRef.current?.click();
  };

  const newUploads = pending.filter((p) => !p.replaces);
  const replacing = new Map(pending.filter((p) => p.replaces).map((p) => [p.replaces!, p]));
  const slotsLeft = max - value.length - newUploads.length;

  const iconBtn =
    "w-8 h-8 flex items-center justify-center bg-white/95 border border-[#E5E5E2] text-[#111111] hover:border-[#111111] disabled:opacity-30 disabled:pointer-events-none transition-colors";

  return (
    <div
      className="space-y-3 text-xs outline-none"
      onPaste={onPaste}
      onDragOver={(e) => {
        e.preventDefault();
        if (dragIndex === null) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
      }}
      onDrop={onDrop}
      tabIndex={-1}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-wider text-[#6B6B6B]">
          Product Images <span className="text-[#A83232]">*</span>{" "}
          <span className="font-mono normal-case tracking-normal">
            ({value.length}/{max})
          </span>
        </p>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="text-[11px] font-semibold text-[#111111] hover:underline flex items-center min-h-[32px]"
        >
          <LinkIcon className="w-3 h-3 mr-1" /> {showUrlInput ? "Cancel URL" : "Add hosted image URL"}
        </button>
      </div>

      <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
        The <strong className="text-[#111111]">cover</strong> image is shown on product cards, in the cart and at checkout. Drag tiles or use the
        arrows to reorder. Removing an image here only takes effect when you save.
      </p>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://res.cloudinary.com/…/image.png"
            aria-label="Hosted image URL"
            className="flex-1 min-w-0 p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
          />
          <button type="button" onClick={addUrl} className="px-4 bg-[#111111] text-white font-semibold uppercase tracking-wider text-[11px]">
            Add
          </button>
        </div>
      )}

      {notices.length > 0 && (
        <div role="alert" className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] font-semibold space-y-1">
          {notices.map((n, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span className="flex-1">{n}</span>
            </div>
          ))}
          <button type="button" onClick={() => setNotices([])} className="underline text-[11px] min-h-[28px]">
            Dismiss
          </button>
        </div>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" aria-label="Product images in display order">
        {value.map((url, idx) => {
          const isCover = idx === 0;
          const replacement = replacing.get(url);
          return (
            <li
              key={url}
              draggable={!replacement}
              onDragStart={(e) => {
                setDragIndex(idx);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(idx));
              }}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => {
                if (dragIndex !== null) e.preventDefault();
              }}
              onDrop={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                e.stopPropagation();
                move(dragIndex, idx);
                setDragIndex(null);
              }}
              className={`relative bg-white border-2 ${isCover ? "border-[#111111]" : "border-[#E5E5E2]"} ${
                dragIndex === idx ? "opacity-40" : ""
              } flex flex-col`}
              data-image-tile={idx}
            >
              <div className="relative aspect-square bg-[#F7F7F5] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={replacement?.preview || url}
                  alt={isCover ? "Cover image" : `Gallery image ${idx + 1}`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                <span
                  className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isCover ? "bg-[#111111] text-[#F5C518]" : "bg-white/90 text-[#6B6B6B] border border-[#E5E5E2]"
                  }`}
                >
                  {isCover ? "★ Cover" : idx + 1}
                </span>
                <GripVertical className="hidden sm:block absolute top-1.5 right-1.5 w-4 h-4 text-[#6B6B6B] cursor-grab" aria-hidden />
                {replacement && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1 p-2 text-center">
                    {replacement.status === "error" ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-[#A83232]" />
                        <span className="text-[10px] text-[#A83232] font-semibold">{replacement.error}</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => retry(replacement)} className="underline text-[11px]">
                            Retry
                          </button>
                          <button type="button" onClick={() => finishPending(replacement.id)} className="underline text-[11px]">
                            Keep original
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-mono text-[11px]">Replacing… {replacement.progress}%</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wraps onto two rows on narrow phone tiles instead of overflowing. */}
              <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 border-t border-[#E5E5E2]">
                <div className="flex gap-1">
                  <button type="button" className={iconBtn} onClick={() => move(idx, idx - 1)} disabled={idx === 0} aria-label={`Move image ${idx + 1} earlier`}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === value.length - 1}
                    aria-label={`Move image ${idx + 1} later`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {!isCover && (
                    <button type="button" className={iconBtn} onClick={() => setCover(idx)} aria-label={`Make image ${idx + 1} the cover`} title="Make cover">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => startReplace(url)}
                    disabled={Boolean(replacement)}
                    aria-label={`Replace image ${idx + 1}`}
                    title="Replace"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} text-[#A83232] hover:border-[#A83232]`}
                    onClick={() => remove(idx)}
                    disabled={Boolean(replacement)}
                    aria-label={`Remove image ${idx + 1}`}
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}

        {newUploads.map((job) => (
          <li key={job.id} className="relative bg-white border-2 border-dashed border-[#E5E5E2] flex flex-col" data-upload-status={job.status}>
            <div className="relative aspect-square bg-[#F7F7F5] flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.preview} alt="" className="w-full h-full object-contain opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                {job.status === "error" ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-[#A83232]" />
                    <span className="text-[10px] text-[#A83232] font-semibold leading-tight">{job.error}</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#111111]" />
                    <span className="font-mono text-[11px] text-[#111111]">{job.status === "queued" ? "Waiting…" : `${job.progress}%`}</span>
                  </>
                )}
              </div>
              {job.status === "uploading" && (
                <div className="absolute bottom-0 left-0 h-1 bg-[#111111] transition-all" style={{ width: `${job.progress}%` }} />
              )}
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5 border-t border-[#E5E5E2] min-h-[44px]">
              <span className="truncate text-[10px] font-mono text-[#6B6B6B]">{job.name}</span>
              {job.status === "error" && (
                <div className="flex gap-1 shrink-0">
                  <button type="button" className={iconBtn} onClick={() => retry(job)} aria-label={`Retry ${job.name}`}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className={`${iconBtn} text-[#A83232]`} onClick={() => finishPending(job.id)} aria-label={`Discard ${job.name}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}

        {slotsLeft > 0 && (
          <li>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-full min-h-[160px] aspect-square flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed text-center transition-colors ${
                isDragOver ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2] hover:border-[#111111] bg-white"
              }`}
            >
              <UploadCloud className="w-6 h-6 text-[#111111]" />
              <span className="font-semibold text-[#111111]">{value.length === 0 ? "Add product images" : "Add more images"}</span>
              <span className="text-[10px] text-[#6B6B6B] leading-snug">
                Select several at once, drag &amp; drop, or paste (Ctrl+V)
                <br />
                JPG, PNG, WEBP · max 5 MB · {slotsLeft} left
              </span>
            </button>
          </li>
        )}
      </ul>

      {isDragOver && dragIndex === null && (
        <p className="text-center font-semibold text-[#111111]" aria-hidden>
          Drop images to upload
        </p>
      )}

      <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={onPick} className="hidden" />
      <input ref={replaceInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={onReplacePick} className="hidden" />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
