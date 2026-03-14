"use client";

import { useState } from "react";

type Props = {
  productId: string;
  productTitle: string;
  imageUrls: string[];
  deleteAction: (formData: FormData) => Promise<void>;
  addUrlAction: (formData: FormData) => Promise<void>;
  uploadAction: (formData: FormData) => Promise<void>;
};

type AddMode = "upload" | "url";

export function ProductImageField({
  productId,
  productTitle,
  imageUrls,
  deleteAction,
  addUrlAction,
  uploadAction,
}: Props) {
  const [mode, setMode] = useState<AddMode>("upload");

  return (
    <div className="space-y-3 rounded-lg border border-graphite/12 bg-white/70 p-3">
      {/* Existing images */}
      {imageUrls.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.12em] text-graphite/50">Current images</p>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div
                key={url}
                className="group relative flex items-center gap-2 rounded-md border border-graphite/12 bg-white p-1.5 pr-2"
              >
                {/* Thumbnail */}
                <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${productTitle} image ${i + 1}`}
                    className="h-10 w-10 rounded object-cover"
                  />
                </a>
                <span className="max-w-[120px] truncate text-xs text-graphite/60">
                  Image {i + 1}
                  {i === 0 && (
                    <span className="ml-1 text-mineral/70">(primary)</span>
                  )}
                </span>
                {/* Delete */}
                <form action={deleteAction}>
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="imageUrl" value={url} />
                  <button
                    type="submit"
                    className="ml-1 rounded px-1 text-xs text-graphite/40 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete image"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-graphite/50">No images yet.</p>
      )}

      {/* Add image */}
      <div>
        <div className="mb-2 flex gap-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              mode === "upload"
                ? "bg-mineral/10 text-mineral"
                : "text-graphite/55 hover:text-graphite"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              mode === "url"
                ? "bg-mineral/10 text-mineral"
                : "text-graphite/55 hover:text-graphite"
            }`}
          >
            External URL
          </button>
        </div>

        {mode === "upload" ? (
          <form action={uploadAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="productId" value={productId} />
            <div className="flex-1">
              <input
                name="imageAlt"
                placeholder="Alt text (optional)"
                className="input-premium w-full py-1.5 text-xs"
              />
            </div>
            <div className="flex-1">
              <input
                type="file"
                name="galleryImageFile"
                accept="image/*"
                required
                className="w-full cursor-pointer rounded-lg border border-graphite/18 bg-white/85 px-2.5 py-1.5 text-xs"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-graphite/18 bg-white px-3 py-1.5 text-xs font-medium text-graphite transition hover:border-mineral/30 hover:text-mineral"
            >
              Upload
            </button>
          </form>
        ) : (
          <form action={addUrlAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="productId" value={productId} />
            <div className="flex-[2]">
              <input
                name="imageUrl"
                type="url"
                required
                placeholder="https://..."
                className="input-premium w-full py-1.5 text-xs"
              />
            </div>
            <div className="flex-1">
              <input
                name="imageAlt"
                placeholder="Alt text (optional)"
                className="input-premium w-full py-1.5 text-xs"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-graphite/18 bg-white px-3 py-1.5 text-xs font-medium text-graphite transition hover:border-mineral/30 hover:text-mineral"
            >
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
