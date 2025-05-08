"use client";

import { IPAsset } from "@/types/ip";
import MediaRenderer from "./MediaRenderer";
import {
  CalendarDays,
  Clock,
  FileType,
  Music,
  Image as ImageIcon,
  Video,
} from "lucide-react";

interface IPHeroProps {
  ip: IPAsset;
}

export default function IPHero({ ip }: IPHeroProps) {
  // Format creation date
  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get media type icon
  const getMediaTypeIcon = () => {
    if (ip.mediaType.startsWith("audio/")) {
      return <Music className="h-3 w-3 mr-1.5 text-accentOrange" />;
    } else if (ip.mediaType.startsWith("video/")) {
      return <Video className="h-3 w-3 mr-1.5 text-accentGreen" />;
    } else {
      return <ImageIcon className="h-3 w-3 mr-1.5 text-accentPurple" />;
    }
  };

  // Format media type name
  const formatMediaType = (mediaType: string) => {
    const [type, format] = mediaType.split("/");
    return `${type.charAt(0).toUpperCase() + type.slice(1)} (${format.toUpperCase()})`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <MediaRenderer
          mediaUrl={ip.mediaUrl}
          mediaType={ip.mediaType}
          title={ip.title}
          fallbackImageUrl={ip.image}
        />
      </div>
      <div className="md:col-span-2 flex flex-col">
        <div className="bg-cardBg rounded-md border border-border p-4">
          <div className="space-y-2">
            <h1 className="text-lg font-bold">{ip.title}</h1>
            <div className="text-sm text-textMuted">{ip.description}</div>

            <div className="flex flex-wrap gap-1 pt-1">
              {ip.ipType && (
                <div className="bg-accentPurple/10 text-accentPurple text-xs px-2 py-0.5 rounded-full">
                  {ip.ipType}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center text-xs text-textMuted">
              <CalendarDays className="h-3 w-3 mr-1.5 text-accentPurple" />
              <span>Created on {formatDate(ip.createdAt)}</span>
            </div>
            <div className="flex items-center text-xs text-textMuted">
              <FileType className="h-3 w-3 mr-1.5 text-accentGreen" />
              <span>IP Type: {ip.ipType}</span>
            </div>
            <div className="flex items-center text-xs text-textMuted">
              {getMediaTypeIcon()}
              <span>Media Type: {formatMediaType(ip.mediaType)}</span>
            </div>
            <div className="flex items-center text-xs text-textMuted">
              <Clock className="h-3 w-3 mr-1.5 text-accentOrange" />
              <span>Last Updated: {formatDate(ip.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
