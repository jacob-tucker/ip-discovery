"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { IPAsset } from "@/types/ip";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
  showResults?: boolean;
}

export default function SearchBar({
  onSearch,
  className = "",
  showResults = true,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter results for suggestions only
  useEffect(() => {
    const timer = setTimeout(() => {
      const isIpIdInput = isValidIpId(query);
      setIsIpId(isIpIdInput);

      if (!isIpIdInput && query.length > 0) {
        const filteredResults = ipAssets
          .filter(
            (item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5); // Limit to 5 results
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, ipAssets]);

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

  // Handle search without filtering main content
  const handleSearch = (value: string) => {
    setQuery(value);
    // We don't pass the query to onSearch anymore to prevent filtering
  };

  // Handle IP ID search
  const handleIpIdSearch = () => {
    if (isIpId) {
      router.push(`/ip/${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
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
            ${query ? "rotate-12" : ""}
          `}
          onClick={() => {
            const inputElement = searchRef.current?.querySelector("input");
            if (inputElement) inputElement.focus();
          }}
        >
          <Search
            className={`
              h-4 w-4 transform transition-all duration-300
              ${query ? "rotate-12" : ""}
              ${isSearchFocused ? "animate-pulse" : ""}
            `}
          />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            handleSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isIpId) {
              handleIpIdSearch();
            }
          }}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Search IP name or ipId..."
          className={`
            w-full py-2.5 pl-2 pr-4 text-sm bg-transparent 
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

        {query && (
          <button
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
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
      {showResults &&
        isSearchFocused &&
        searchResults.length > 0 &&
        !isIpId && (
          <div className="absolute top-full left-0 right-0 mt-1 py-2 bg-background rounded-md shadow-lg border border-border/20 z-50 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between px-3 pb-1">
              <div className="text-xs text-textMuted uppercase tracking-wider">
                Results
              </div>
              {query && (
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
                    setQuery("");
                    setIsSearchFocused(false);
                    onSearch("");
                  }}
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded bg-background mr-3">
                    {imageErrors[result.ipId] ? (
                      <div className="h-10 w-10 flex items-center justify-center bg-cardBg">
                        <Image
                          src="/placeholder-image.png"
                          alt="Placeholder"
                          width={40}
                          height={40}
                          className="object-cover"
                        />
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
                    <div className="text-xs text-textMuted truncate">
                      {result.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      {/* No Results */}
      {showResults &&
        isSearchFocused &&
        query &&
        searchResults.length === 0 &&
        !isIpId && (
          <div className="absolute top-full left-0 right-0 mt-1 py-3 bg-background rounded-md shadow-lg border border-border/20 z-50 animate-in fade-in-50 duration-150">
            <div className="text-center text-sm text-textMuted">
              No results found
            </div>
          </div>
        )}
    </div>
  );
}
