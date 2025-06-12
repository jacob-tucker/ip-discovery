"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
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
    staleTime: 5 * 60 * 1000,
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--accent-orange)_0%,transparent_35%),radial-gradient(circle_at_bottom_left,var(--accent-purple)_0%,transparent_35%)] opacity-[0.03]" />

          <div className="container relative">
            <div className="flex flex-col lg:flex-row items-center justify-between py-16 md:py-24 gap-16 lg:gap-24">
              {/* Content */}
              <div className="flex-1 max-w-2xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-accentOrange via-pink-500 to-accentPurple bg-clip-text text-transparent">
                    Discover Story's Top&nbsp;IPs
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-textMuted mb-8 leading-relaxed">
                  Your gateway to Story's premier intellectual property. Browse
                  popular IPs, explore trending assets, and stay connected with
                  the latest licensing and dispute activity.
                </p>

                <div className="max-w-xl">
                  <SearchBar onSearch={setSearchQuery} />
                </div>
              </div>

              {/* Featured IP Preview */}
              {!isLoading && ipAssets[0] && (
                <div className="hidden lg:flex lg:flex-1 w-full max-w-md">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-accentOrange via-pink-500 to-accentPurple rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative p-1 bg-gradient-to-r from-accentOrange/10 via-pink-500/10 to-accentPurple/10 rounded-2xl">
                      <div className="bg-cardBg rounded-xl overflow-hidden">
                        <div className="aspect-[4/3] relative">
                          <img
                            src={ipAssets[0].image || "/placeholder-image.png"}
                            alt="Featured IP"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-lg font-semibold text-white">
                              {ipAssets[0].title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Featured IPs Section */}
        <div className="container py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accentOrange" />
              <h2 className="text-2xl font-bold">Featured IP Assets</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
              <div>
                <RoyaltyPayments limit={5} isHomepage={true} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
