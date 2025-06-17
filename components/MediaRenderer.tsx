"use client";

import Image from "next/image";
import { useState } from "react";
import { Music } from "lucide-react";

interface MediaRendererProps {
  mediaUrl: string;
  mediaType: string;
  title: string;
  fallbackImageUrl?: string;
}

export default function MediaRenderer({
  mediaUrl,
  mediaType,
  title,
  fallbackImageUrl,
}: MediaRendererProps) {
  const [isError, setIsError] = useState(false);

  // Check if media type is audio
  const isAudio = mediaType.startsWith("audio/");

  // Check if media type is video
  const isVideo = mediaType.startsWith("video/");

  // If media type is not recognized, default to image
  const fallbackImage = fallbackImageUrl || "/placeholder-image.jpg";

  if (isAudio) {
    return (
      <div className="w-full h-full bg-background">
        {fallbackImageUrl && !isError ? (
          <div className="relative w-full h-full">
            <Image
              src={fallbackImageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              priority
              className="object-cover"
              onError={() => setIsError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end p-2">
              <div className="text-white text-xs font-medium truncate">
                {title}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-background">
            <div className="rounded-full bg-black/5 p-4">
              <Music className="h-8 w-8 text-accentOrange" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative aspect-video w-full bg-background border border-border rounded-md overflow-hidden">
        <video
          src={mediaUrl}
          controls
          className="w-full h-full"
          poster={fallbackImage}
          title={title}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Default to image renderer
  return (
    <div className="relative aspect-square w-full bg-background border border-border rounded-md overflow-hidden">
      {isError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <p className="text-xs text-textMuted">Failed to load image</p>
        </div>
      ) : (
        <Image
          src={mediaUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          priority
          className="object-cover"
          onError={() => setIsError(true)}
        />
      )}
    </div>
  );
}
