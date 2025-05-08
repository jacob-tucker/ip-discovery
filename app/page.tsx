"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import IPCard from "@/components/IPCard";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import { getIPAssets } from "@/lib/data";
import { IPAsset } from "@/types/ip";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: ipAssets = [], isLoading } = useQuery({
    queryKey: ["ipAssets"],
    queryFn: getIPAssets,
  });

  const filteredAssets = ipAssets.filter(
    (ip: IPAsset) =>
      ip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-12 flex-grow">
        <div className="mb-8 flex justify-center">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        {isLoading ? (
          <p className="text-center text-textMuted">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((ip: IPAsset) => (
              <IPCard key={ip.title} ip={ip} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
