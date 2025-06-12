"use client";

import Image from "next/image";
import Link from "next/link";
import { IPAsset } from "@/types/ip";
import { motion } from "framer-motion";
import { Calendar, User, Music, Video, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { formatDate, formatMediaType } from "@/lib/utils";

interface IPCardProps {
  ip: IPAsset;
}

export default function IPCard({ ip }: IPCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get main creator (first one)
  const mainCreator =
    ip.creators && ip.creators.length > 0 ? ip.creators[0] : null;

  // Media type handling
  const mediaTypeInfo = formatMediaType(ip.mediaType);
  const isAudio = mediaTypeInfo.type === "AUDIO";
  const isVideo = mediaTypeInfo.type === "VIDEO";

  // Get media type icon
  const getMediaTypeIcon = () => {
    if (isAudio) {
      return <Music className="h-4 w-4 text-accentOrange" />;
    } else if (isVideo) {
      return <Video className="h-4 w-4 text-accentGreen" />;
    } else {
      return <ImageIcon className="h-4 w-4 text-accentPurple" />;
    }
  };

  // Format media type for display
  const getDisplayMediaType = () => {
    if (mediaTypeInfo.format) {
      return `${mediaTypeInfo.type} • ${mediaTypeInfo.format}`;
    }
    return mediaTypeInfo.type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="group h-full"
    >
      <Link
        href={`/ip/${encodeURIComponent(ip.ipId)}`}
        className="block h-full"
      >
        <div className="h-full flex flex-col bg-cardBg rounded-lg border border-border/40 overflow-hidden hover:border-accentPurple/30 hover:shadow-md transition-all duration-300">
          {/* Compact card layout with image and content side by side */}
          <div className="flex p-3 gap-3">
            {/* Image container - Compact, fixed size */}
            <div className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-background/70 border border-border/30">
              {imageError ? (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="rounded-full bg-black/5 p-2">
                    {getMediaTypeIcon()}
                  </div>
                </div>
              ) : (
                <>
                  {/* Loading spinner */}
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-6 h-6 border-2 border-accentPurple/30 border-t-accentPurple rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Actual image */}
                  <div className="h-full w-full flex items-center justify-center">
                    <Image
                      src={ip.image}
                      alt={ip.title}
                      className={`object-contain w-full h-full transition-all duration-500 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                      } group-hover:scale-[1.05]`}
                      width={96}
                      height={96}
                      onError={() => setImageError(true)}
                      onLoad={() => setImageLoaded(true)}
                      priority={true}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Content container */}
            <div className="flex-grow min-w-0">
              {/* Media type badge */}
              <div className="flex items-center mb-1.5">
                <div className="inline-flex items-center bg-background px-1.5 py-0.5 rounded text-[10px] font-medium border border-border/30">
                  {getMediaTypeIcon()}
                  <span className="ml-1 truncate">{getDisplayMediaType()}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold line-clamp-1 mb-1">
                {ip.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-textMuted line-clamp-2 mb-1.5">
                {ip.description}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 pb-3 pt-1 flex items-center justify-between text-[10px] mt-auto border-t border-border/20">
            {/* Creator */}
            {mainCreator && (
              <div className="flex items-center overflow-hidden">
                <div className="w-4 h-4 rounded-full bg-background flex items-center justify-center text-accentGreen border border-border/30">
                  <User className="h-2.5 w-2.5" />
                </div>
                <span className="ml-1.5 line-clamp-1 font-medium max-w-[100px] truncate">
                  {mainCreator.name || "Creator"}
                </span>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center text-textMuted">
              <Calendar className="h-2.5 w-2.5 mr-1 text-accentPurple opacity-70" />
              {formatDate(ip.createdAt)}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
