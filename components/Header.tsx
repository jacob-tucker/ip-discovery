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
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { IPAsset } from "@/types/ip";
import { useRouter } from "next/navigation";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<IPAsset[]>([]);
  const [isIpId, setIsIpId] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Function to check if string is a valid Ethereum address (ipId)
  const isValidIpId = (str: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(str);
  };

  // Fetch all featured IP assets for search
  const { data: ipAssets = [] } = useQuery<IPAsset[]>({
    queryKey: ["featuredIpAssets"],
    queryFn: async () => {
      const response = await fetch("/api/featured-ips");
      if (!response.ok) {
        throw new Error("Failed to fetch featured IPs");
      }
      return response.json();
    },
    // Set a reasonable stale time to minimize network requests
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter results based on search query
  useEffect(() => {
    const timer = setTimeout(() => {
      const isIpIdInput = isValidIpId(searchQuery);
      setIsIpId(isIpIdInput);

      if (!isIpIdInput && searchQuery.length > 0) {
        const filteredResults = ipAssets
          .filter(
            (item) =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5); // Limit to 5 results for performance
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
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

  // Handle image error
  const handleImageError = (ipId: string) => {
    setImageErrors((prev) => ({ ...prev, [ipId]: true }));
  };

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

  // Handle IP ID search
  const handleIpIdSearch = () => {
    if (isIpId) {
      router.push(`/ip/${encodeURIComponent(searchQuery)}`);
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
              IP on Top
            </span>
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-accentOrange to-pink-500 transition-all duration-300"></div>
          </div>
        </Link>

        <div ref={searchRef} className="relative w-80">
          <div
            className={`
            flex items-center transition-all duration-200 ease-in-out rounded-full
            border shadow-sm overflow-hidden
            ${
              isSearchFocused
                ? "bg-background shadow-md ring-2 ring-accentOrange/20 border-accentOrange"
                : "bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/80"
            }
          `}
          >
            <div
              className={`
                ml-3 transition-all duration-300 ease-in-out
                ${isSearchFocused ? "text-accentOrange scale-110" : "text-textMuted"}
                ${searchQuery ? "rotate-12" : ""}
              `}
              onClick={() => {
                const inputElement = searchRef.current?.querySelector("input");
                if (inputElement) inputElement.focus();
              }}
            >
              <Search
                className={`
                h-4 w-4 transform transition-all duration-300
                ${searchQuery ? "rotate-12" : ""}
                ${isSearchFocused ? "animate-pulse" : ""}
              `}
              />
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isIpId) {
                    handleIpIdSearch();
                  }
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search IP name or ipId..."
                className={`
                  w-full py-2 pl-2 pr-4 text-sm bg-transparent 
                  border-0 border-none outline-none ring-0
                  appearance-none focus:appearance-none
                  focus:outline-none focus:ring-0 focus:shadow-none
                  focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none
                  placeholder:text-textMuted/70 transition-all duration-200
                `}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  outline: "none",
                }}
              />
              <div className="absolute inset-0 pointer-events-none"></div>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mr-3 text-textMuted hover:text-textPrimary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {isIpId && (
              <button
                onClick={handleIpIdSearch}
                className="mr-3 text-accentOrange hover:text-accentOrange/80 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* IP ID Detection Message */}
          {isIpId && isSearchFocused && (
            <div
              onClick={handleIpIdSearch}
              className="absolute top-full left-0 right-0 mt-1 py-2 px-3 bg-background rounded-md shadow-lg border border-border/20 z-50 animate-in fade-in-50 duration-150 cursor-pointer hover:bg-cardBg group transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-accentOrange">IP ID detected</div>
                <div className="text-xs bg-accentOrange/10 text-accentOrange px-2 py-1 rounded-full group-hover:bg-accentOrange/20 transition-colors">
                  View IP →
                </div>
              </div>
            </div>
          )}

          {/* Search Results Dropdown */}
          {isSearchFocused && searchResults.length > 0 && !isIpId && (
            <div className="absolute top-full left-0 right-0 mt-1 py-2 bg-background rounded-md shadow-lg border border-border/20 z-50 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between px-3 pb-1">
                <div className="text-xs text-textMuted uppercase tracking-wider">
                  Results
                </div>
                {searchQuery && (
                  <div className="text-xs bg-accentOrange/10 text-accentOrange px-1.5 py-0.5 rounded-full">
                    {searchResults.length}
                  </div>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <Link
                    href={`/ip/${encodeURIComponent(result.ipId)}`}
                    key={result.ipId}
                    className="flex items-center px-3 py-2 hover:bg-cardBg transition-colors cursor-pointer"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-background mr-3">
                      {imageErrors[result.ipId] ? (
                        <div className="h-10 w-10 flex items-center justify-center bg-cardBg">
                          <ImageIcon className="h-5 w-5 text-textMuted" />
                        </div>
                      ) : (
                        <Image
                          src={result.image || "/placeholder-image.png"}
                          alt={result.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                          onError={() => handleImageError(result.ipId)}
                          unoptimized={true}
                        />
                      )}
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
          {isSearchFocused &&
            searchQuery &&
            searchResults.length === 0 &&
            !isIpId && (
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
