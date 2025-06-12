"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, AlertTriangle, Shield, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDisputesForIP } from "@/lib/data";
import { convertHashIPFStoCID } from "@/lib/ipfs";
import { IPAsset } from "@/types/ip";

interface IPDisputesProps {
  ip: IPAsset;
}

interface Dispute {
  id: string;
  targetTag: string;
  status: string;
  arbitrationPolicy: string;
  initiator: string;
  disputeTimestamp: number;
  evidenceHash?: string;
  counterEvidenceHash?: string;
  umaLink?: string;
}

// Mapping of target tags to display names
const TAG_MAPPING: { [key: string]: string } = {
  "0x494d50524f5045525f524547495354524154494f4e0000000000000000000000":
    "Improper Registration",
  "0x494d50524f5045525f5553414745000000000000000000000000000000000000":
    "Improper Usage",
  "0x494d50524f5045525f5041594d454e5400000000000000000000000000000000":
    "Improper Payment",
  "0x434f4e54454e545f5354414e44415244535f56494f4c4154494f4e0000000000":
    "Content Standards Violation",
  "0x494e5f4449535055544500000000000000000000000000000000000000000000":
    "In Dispute",
};

const formatUMALink = (originalLink: string): string => {
  try {
    const url = new URL(originalLink);
    // Add /settled to the pathname
    url.pathname = "/settled";
    // Get the transaction hash from the original eventIndex parameter
    const searchParams = new URLSearchParams(url.search);
    const txHash = searchParams.get("transactionHash");
    // Clear existing params and set the new search parameter
    searchParams.delete("transactionHash");
    searchParams.delete("eventIndex");
    if (txHash) {
      searchParams.set("search", txHash);
    }
    url.search = searchParams.toString();
    return url.toString();
  } catch (e) {
    console.error("Error formatting UMA link:", e);
    return originalLink;
  }
};

// Format address for display
const formatAddress = (address: string) => {
  if (!address) return "Unknown";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export default function IPDisputes({ ip }: IPDisputesProps) {
  const {
    data: disputes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["disputes", ip.ipId],
    queryFn: () => getDisputesForIP(ip.ipId),
    enabled: !!ip.ipId,
  });

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-md border border-border animate-pulse">
        <div className="p-3 border-b border-border">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1 text-accentOrange" />
            <h3 className="text-sm font-semibold">Disputes</h3>
          </div>
        </div>
        <div className="p-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-background rounded-md p-3 mb-2 border border-border"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-cardBg rounded-md border border-border">
        <div className="p-3 border-b border-border">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1 text-accentOrange" />
            <h3 className="text-sm font-semibold">Disputes</h3>
          </div>
        </div>
        <div className="p-4 text-center text-sm text-textMuted">
          Failed to load disputes
        </div>
      </div>
    );
  }

  if (!disputes.length) {
    return (
      <div className="bg-cardBg rounded-md border border-border">
        <div className="p-3 border-b border-border">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1 text-accentOrange" />
            <h3 className="text-sm font-semibold">Disputes</h3>
          </div>
        </div>
        <div className="p-4 text-center text-sm text-textMuted">
          No disputes found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-md border border-border">
      <div className="p-3 border-b border-border">
        <div className="flex items-center">
          <Shield className="h-4 w-4 mr-1 text-accentOrange" />
          <h3 className="text-sm font-semibold">Disputes</h3>
        </div>
      </div>

      <div className="p-2">
        {disputes.map((dispute: Dispute) => {
          const targetTag = dispute.targetTag.startsWith("0x")
            ? dispute.targetTag
            : `0x${dispute.targetTag}`;

          const isUMAArbitration =
            dispute.arbitrationPolicy ===
            "0xfFD98c3877B8789124f02C7E8239A4b0Ef11E936";

          return (
            <div
              key={dispute.id}
              className="bg-background rounded-md p-2 mb-2 border border-border hover:border-accentOrange/30 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <AlertTriangle className="h-3 w-3 text-accentOrange mr-1.5" />
                  <span className="text-xs font-medium">
                    {TAG_MAPPING[targetTag] || "Unknown Tag"}
                  </span>
                </div>
                <span className="text-[10px] text-textMuted">
                  {formatDistanceToNow(dispute.disputeTimestamp * 1000, {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="text-textMuted">Status:</span>
                    <span className="capitalize font-medium">
                      {dispute.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-textMuted">Arbitration:</span>
                    {isUMAArbitration ? (
                      <span className="font-bold text-[#FF4A4A] bg-[#FF4A4A]/5 px-1.5 py-0.5 rounded">
                        UMA
                      </span>
                    ) : (
                      <span className="font-medium">Unknown</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-textMuted">Initiator:</span>
                  <span className="font-mono">
                    {formatAddress(dispute.initiator)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {dispute.evidenceHash && (
                  <a
                    href={`https://ipfs.io/ipfs/${convertHashIPFStoCID(dispute.evidenceHash)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-background border border-border px-2 py-1 rounded-full flex items-center hover:border-accentOrange/30 transition-colors"
                  >
                    <FileText className="h-3 w-3 mr-1 text-accentOrange" />
                    Evidence
                  </a>
                )}

                {dispute.counterEvidenceHash && (
                  <a
                    href={`https://ipfs.io/ipfs/${convertHashIPFStoCID(dispute.counterEvidenceHash)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-background border border-border px-2 py-1 rounded-full flex items-center hover:border-accentOrange/30 transition-colors"
                  >
                    <FileText className="h-3 w-3 mr-1 text-accentOrange" />
                    Counter Evidence
                  </a>
                )}

                {dispute.umaLink && (
                  <a
                    href={formatUMALink(dispute.umaLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[10px] bg-background border px-2 py-1 rounded-full flex items-center transition-colors ${
                      isUMAArbitration
                        ? "border-[#FF4A4A]/30 hover:border-[#FF4A4A]/50 hover:bg-[#FF4A4A]/5"
                        : "border-border hover:border-accentOrange/30"
                    }`}
                  >
                    <ExternalLink
                      className={`h-3 w-3 mr-1 ${isUMAArbitration ? "text-[#FF4A4A]" : "text-accentOrange"}`}
                    />
                    UMA Details
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
