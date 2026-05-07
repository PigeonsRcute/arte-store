"use client";

import { useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  title: string;
};

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-100 ring-4 ring-pink-200 shadow-xl">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={`${title} — image ${activeIndex + 1}`}
            fill
            className="object-contain transition-opacity duration-200"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400 text-sm font-medium">
            No image available
          </div>
        )}

        {/* Image counter badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-3 transition-all duration-150 ${
                index === activeIndex
                  ? "border-pink-500 shadow-md scale-105"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-pink-300"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={url}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
