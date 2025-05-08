"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Clock, ChevronRight, ExternalLink, User } from "lucide-react";
import { IPAsset } from "@/types/ip";
import { getAllRoyaltyPayments } from "@/lib/data";
import { RoyaltyPayment } from "@/types/royalty";

interface IPRoyaltiesProps {
  ip: IPAsset;
}

export default function IPRoyalties({ ip }: IPRoyaltiesProps) {
  const [showAll, setShowAll] = useState(false);
  const limit = showAll ? undefined : 3;

  // Use the available getAllRoyaltyPayments function and filter in the component
  const {
    data: allRoyaltyPayments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["royaltyPayments"],
    queryFn: getAllRoyaltyPayments,
  });

  // Filter payments for this specific IP
  const royaltyPayments = allRoyaltyPayments
    .filter((payment) => payment.ipId === ip.title)
    .slice(0, limit ? limit : undefined);

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
        <div className="p-3 border-b border-border">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-1 text-accentGreen" />
            <h3 className="text-sm font-semibold">Royalty Payments</h3>
          </div>
        </div>
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
        <div className="p-3 border-b border-border">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-1 text-accentGreen" />
            <h3 className="text-sm font-semibold">Royalty Payments</h3>
          </div>
        </div>
        <div className="p-3 text-center text-sm text-textMuted">
          Error loading royalty data
        </div>
      </div>
    );
  }

  if (royaltyPayments.length === 0) {
    return (
      <div className="bg-cardBg rounded-md border border-border">
        <div className="p-3 border-b border-border">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-1 text-accentGreen" />
            <h3 className="text-sm font-semibold">Royalty Payments</h3>
          </div>
        </div>
        <div className="p-3 text-center text-sm text-textMuted">
          No royalty payments found for this IP
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-md border border-border">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-1 text-accentGreen" />
            <h3 className="text-sm font-semibold">Royalty Payments</h3>
          </div>
          <span className="text-xs text-textMuted">
            {royaltyPayments.length} payments
          </span>
        </div>
        <p className="text-xs text-textMuted">
          Latest royalty payments received for this IP
        </p>
      </div>

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
                    (${payment.usdAmount.toFixed(2)})
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
                  href={`https://explorer.storyprotocol.xyz/tx/${payment.transactionHash}`}
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

        {royaltyPayments.length > 0 && (
          <button
            onClick={toggleViewAll}
            className="w-full mt-1 py-1.5 px-3 text-xs flex items-center justify-center text-accentGreen border border-border rounded-md hover:bg-accentGreen/5 transition-colors"
          >
            {showAll ? "Show Less" : "View All Royalty Payments"}
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
