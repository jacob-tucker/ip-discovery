"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import IPCard from "@/components/IPCard";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import RoyaltyPayments from "@/components/RoyaltyPayments";
import { getIPAssets } from "@/lib/data";
import { IPAsset } from "@/types/ip";
import Link from "next/link";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: ipAssets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ipAssets"],
    queryFn: getIPAssets,
    staleTime: 60 * 1000, // 1 minute
    retry: 1, // Retry once
  });

  // Log error if there is one
  if (error) {
    console.error("Error in home page data fetching:", error);
  }

  const filteredAssets = ipAssets.filter(
    (ip: IPAsset) =>
      ip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.description.toLowerCase().includes(searchQuery.toLowerCase())
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
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4">
                    <div className="h-4 bg-background rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-background rounded"></div>
                      <div className="h-4 bg-background rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredAssets.map((ip: IPAsset) => (
                  <IPCard key={ip.title} ip={ip} />
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
                <Link
                  href="/royalties"
                  className="text-xs text-accentPurple hover:underline"
                >
                  See All Payments
                </Link>
              </div>
              <RoyaltyPayments limit={4} isHomepage={true} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
