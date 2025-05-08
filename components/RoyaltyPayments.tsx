"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Clock, ChevronRight, ExternalLink, User } from "lucide-react";
import { getAllRoyaltyPayments, getIPAssetById } from "@/lib/data";
import { RoyaltyPayment } from "@/types/royalty";
import { IPAsset } from "@/types/ip";
import { formatUSD } from "@/lib/tokenPrice";

interface RoyaltyPaymentsProps {
  limit?: number;
  isHomepage?: boolean;
}

export default function RoyaltyPayments({
  limit = 4,
  isHomepage = false,
}: RoyaltyPaymentsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = showAll ? undefined : limit;
  const [ipTitles, setIpTitles] = useState<Record<string, string>>({});

  // Fetch royalty payments
  const {
    data: allRoyaltyPayments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["royaltyPayments"],
    queryFn: getAllRoyaltyPayments,
  });

  // Get the payments limited to the display limit
  const royaltyPayments = allRoyaltyPayments.slice(0, displayLimit);

  console.log("RoyaltyPayments.tsx - royaltyPayments:", royaltyPayments);

  // Fetch IP titles for each unique ipId
  useEffect(() => {
    const fetchIpTitles = async () => {
      if (!royaltyPayments.length) return;

      const uniqueIpIds = Array.from(
        new Set(royaltyPayments.map((p) => p.ipId))
      );
      const titles: Record<string, string> = {};

      for (const ipId of uniqueIpIds) {
        try {
          const ipAsset = await getIPAssetById(ipId);
          if (ipAsset) {
            titles[ipId] = ipAsset.title;
          } else {
            titles[ipId] = "Unknown IP";
          }
        } catch (err) {
          console.error(`Error fetching IP title for ${ipId}:`, err);
          titles[ipId] = "Unknown IP";
        }
      }

      setIpTitles(titles);
    };

    if (royaltyPayments.length > 0) {
      fetchIpTitles();
    }
  }, [JSON.stringify(royaltyPayments.map((p) => p.ipId))]);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format transaction hash for display
  const formatTxHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time from timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle click to view all
  const toggleViewAll = () => {
    setShowAll(!showAll);
  };

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-md border border-border">
        {!isHomepage && (
          <div className="p-3 border-b border-border">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-1 text-accentGreen" />
              <h3 className="text-sm font-semibold">Recent Royalty Payments</h3>
            </div>
          </div>
        )}
        <div className="p-3 flex items-center justify-center">
          <Clock className="h-4 w-4 animate-pulse text-accentGreen" />
          <span className="ml-2 text-sm text-textMuted">
            Loading royalties...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-cardBg rounded-md border border-border">
        {!isHomepage && (
          <div className="p-3 border-b border-border">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-1 text-accentGreen" />
              <h3 className="text-sm font-semibold">Recent Royalty Payments</h3>
            </div>
          </div>
        )}
        <div className="p-3 text-center text-sm text-textMuted">
          Error loading royalty data
        </div>
      </div>
    );
  }

  if (royaltyPayments.length === 0) {
    return (
      <div className="bg-cardBg rounded-md border border-border">
        {!isHomepage && (
          <div className="p-3 border-b border-border">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-1 text-accentGreen" />
              <h3 className="text-sm font-semibold">Recent Royalty Payments</h3>
            </div>
          </div>
        )}
        <div className="p-3 text-center text-sm text-textMuted">
          No royalty payments found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-md border border-border">
      {!isHomepage && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-1 text-accentGreen" />
              <h3 className="text-sm font-semibold">Recent Royalty Payments</h3>
            </div>
            <span className="text-xs text-textMuted">
              {allRoyaltyPayments.length} payments
            </span>
          </div>
          <p className="text-xs text-textMuted">
            Latest royalty payments across all IPs
          </p>
        </div>
      )}

      <div className="p-2">
        <AnimatePresence>
          {royaltyPayments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
              className="mb-2 bg-background p-2 rounded-md border border-border hover:border-accentGreen/30 transition-colors group"
            >
              {/* IP Title - Only for global royalty payments list */}
              <div className="mb-1">
                <Link href={`/ip/${payment.ipId}`} className="inline-block">
                  <span className="text-xs font-semibold hover:text-accentGreen transition-colors">
                    {ipTitles[payment.ipId] || formatAddress(payment.ipId)}
                  </span>
                </Link>
              </div>

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1 text-textMuted" />
                  <span className="text-xs text-textMuted mr-1">Payer:</span>
                  <span className="text-xs font-medium truncate max-w-[110px] md:max-w-[180px]">
                    {formatAddress(payment.fromAddress)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-accentGreen font-medium">
                    {payment.amount} $IP
                  </span>
                  <span className="hidden sm:inline-block text-xs text-textMuted ml-1">
                    ({formatUSD(payment.usdAmount)})
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-textMuted">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(payment.timestamp)}</span>
                  <span className="mx-1 text-textMuted/40">•</span>
                  <span>{formatTime(payment.timestamp)}</span>
                </div>

                <Link
                  href={`https://storyscan.io/tx/${payment.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View transaction ${payment.transactionHash}`}
                  className="flex items-center text-accentGreen/70 hover:text-accentGreen transition-colors"
                >
                  <span className="text-xs mr-1">View Tx</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {allRoyaltyPayments.length > limit && (
          <button
            onClick={toggleViewAll}
            className="w-full mt-1 py-1.5 px-3 text-xs flex items-center justify-center text-accentGreen border border-border rounded-md hover:bg-accentGreen/5 transition-colors"
          >
            {showAll
              ? "Show Less"
              : `View All Royalty Payments (${allRoyaltyPayments.length})`}
            <ChevronRight
              className={`h-3 w-3 ml-1 transition-transform ${
                showAll ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
