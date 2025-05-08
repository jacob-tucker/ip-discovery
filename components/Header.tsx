"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Music,
  Film,
  Image as ImageIcon,
  FileText,
  Disc,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getIPAssets } from "@/lib/data";
import { IPAsset } from "@/types/ip";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<IPAsset[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all IP assets
  const { data: ipAssets = [] } = useQuery({
    queryKey: ["ipAssets"],
    queryFn: getIPAssets,
  });

  // Filter results based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        const filteredResults = ipAssets
          .filter(
            (item) =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5); // Limit to 5 results for performance
        setSearchResults(filteredResults);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, ipAssets]);

  // Handle clicks outside of search to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get appropriate icon for media type
  const getMediaIcon = (mediaType: string) => {
    if (mediaType.startsWith("audio/")) {
      return <Music className="h-3 w-3" />;
    } else if (mediaType.startsWith("video/")) {
      return <Film className="h-3 w-3" />;
    } else if (mediaType.startsWith("image/")) {
      return <ImageIcon className="h-3 w-3" />;
    } else {
      return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <header className="py-4 border-b border-border/10">
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <div className="bg-gradient-to-r from-accentOrange to-pink-500 p-1.5 rounded-md mr-2 transform group-hover:rotate-12 transition-transform duration-300">
            <Disc className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-accentOrange to-pink-500">
              IP Discovery
            </span>
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-accentOrange to-pink-500 transition-all duration-300"></div>
          </div>
        </Link>

        <div ref={searchRef} className="relative w-80">
          <div
            className={`
            flex items-center transition-all duration-200 ease-in-out rounded-full
            ${isSearchFocused ? "bg-background shadow-md ring-1 ring-accentOrange/30" : "bg-transparent border border-border/20"}
          `}
          >
            <Search
              className={`
              h-4 w-4 ml-3 transition-colors duration-200
              ${isSearchFocused ? "text-accentOrange" : "text-textMuted"}
            `}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search IPs..."
              className={`
                w-full py-2 pl-2 pr-4 text-sm bg-transparent border-none
                focus:outline-none focus:ring-0 placeholder:text-textMuted/70
              `}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mr-3 text-textMuted hover:text-textPrimary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 py-2 bg-background rounded-md shadow-lg border border-border/20 z-50 animate-in fade-in-50 duration-150">
              <div className="text-xs text-textMuted px-3 pb-1 uppercase tracking-wider">
                Results
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <Link
                    href={`/ip/${encodeURIComponent(result.title)}`}
                    key={result.title}
                    className="flex items-center px-3 py-2 hover:bg-cardBg transition-colors cursor-pointer"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-background mr-3">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {result.title}
                      </div>
                      <div className="flex items-center text-xs text-textMuted">
                        {getMediaIcon(result.mediaType)}
                        <span className="ml-1">
                          {result.mediaType.split("/")[0]}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {isSearchFocused && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 py-3 bg-background rounded-md shadow-lg border border-border/20 z-50 animate-in fade-in-50 duration-150">
              <div className="text-center text-sm text-textMuted">
                No results found
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
