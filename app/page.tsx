"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import IPCard from "@/components/IPCard";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import RoyaltyPayments from "@/components/RoyaltyPayments";
import { IPAsset } from "@/types/ip";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all featured IP assets in one request
  const {
    data: ipAssets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["featuredIpAssets"],
    queryFn: async () => {
      const response = await fetch("/api/featured-ips");
      if (!response.ok) {
        throw new Error("Failed to fetch featured IPs");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matching the API revalidate setting)
    retry: 1,
  });

  // Log any errors
  if (error) {
    console.error("Error fetching featured IP assets:", error);
  }

  const filteredAssets = ipAssets.filter(
    (ip: IPAsset) =>
      ip?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip?.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <SearchBar onSearch={setSearchQuery} />
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse bg-cardBg border border-border rounded-lg p-4"
                  >
                    <div className="h-48 bg-background rounded mb-4"></div>
                    <div className="h-5 bg-background rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-background rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredAssets.map((ip: IPAsset) => (
                  <IPCard key={ip.ipId} ip={ip} />
                ))}
                {filteredAssets.length === 0 && (
                  <div className="col-span-full py-8 text-center text-textMuted">
                    <p>No IP assets found matching your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Royalty Activity</h2>
                <RoyaltyCount />
              </div>
              <RoyaltyPayments limit={20} isHomepage={true} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// New component to display royalty count
function RoyaltyCount() {
  const limit = 20; // Fixed limit of 20
  const initialLimit = 5; // Initial display limit of 5

  // Return a fixed string since we know the limits are constant
  return (
    <span className="text-xs text-textMuted">
      {`${initialLimit} of ${limit} payments`}
    </span>
  );
}
