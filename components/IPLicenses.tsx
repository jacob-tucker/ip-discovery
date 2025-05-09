"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scroll,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  DollarSign,
  CornerRightDown,
  ShieldCheck,
  FileText,
  Globe,
  Cpu,
} from "lucide-react";
import { IPAsset } from "@/types/ip";
import { DetailedLicenseTerms } from "@/types/license";
import { getLicensesForIP } from "@/lib/data";
import { formatExpiration } from "@/lib/licenses";
import { formatUSD } from "@/lib/tokenPrice";
import { formatEther } from "viem";

interface IPLicensesProps {
  ip: IPAsset;
}

export default function IPLicenses({ ip }: IPLicensesProps) {
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [expandedLicense, setExpandedLicense] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<DetailedLicenseTerms[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real license data for the IP
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setIsLoading(true);
        const data = await getLicensesForIP(ip.ipId);
        setLicenses(data);
      } catch (error) {
        console.error("Failed to fetch licenses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenses();
  }, [ip.ipId]);

  const handleLicenseSelect = (licenseId: string) => {
    setSelectedLicense(licenseId === selectedLicense ? null : licenseId);
  };

  const toggleExpandLicense = (licenseId: string) => {
    setExpandedLicense(licenseId === expandedLicense ? null : licenseId);
  };

  const mintLicense = (licenseId: string) => {
    // Redirect to the Portal URL for this asset
    window.open(`https://portal.story.foundation/assets/${ip.ipId}`, "_blank");
  };

  // Format minting fee from wei to tokens with no trailing zeros
  const formatMintingFee = (fee: number | undefined): string => {
    if (!fee) return "0";
    // Convert to string and ensure proper BigInt formatting with a max of 4 decimal places
    const formatted = parseFloat(formatEther(BigInt(fee))).toFixed(4);
    // Remove trailing zeros and decimal point if needed
    return parseFloat(formatted).toString();
  };

  // Format revenue share from large number to percentage with no trailing zeros
  const formatRevShare = (revShare: number | undefined): string => {
    if (!revShare) return "0%";
    // API stores percentages multiplied by 10^6 (e.g., 5000000 = 5%)
    const percentage = (revShare / 1000000).toFixed(2);
    // Remove trailing zeros and decimal point if needed
    return `${parseFloat(percentage)}%`;
  };

  // Show loading state if licenses are still loading
  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-md border border-border p-4">
        <div className="flex items-center justify-center">
          <Scroll className="h-4 w-4 mr-2 text-accentPurple animate-pulse" />
          <span className="text-sm text-textMuted">Loading licenses...</span>
        </div>
      </div>
    );
  }

  // Show a message if no licenses are available
  if (licenses.length === 0) {
    return (
      <div className="bg-cardBg rounded-md border border-border p-4">
        <div className="p-3">
          <div className="flex items-center mb-1">
            <Scroll className="h-4 w-4 mr-1 text-accentPurple" />
            <h3 className="text-sm font-semibold">Licenses</h3>
          </div>
          <p className="text-xs text-textMuted">
            No licenses available for this IP
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-md border border-border">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Scroll className="h-4 w-4 mr-1 text-accentPurple" />
            <h3 className="text-sm font-semibold">Available Licenses</h3>
          </div>
          <span className="text-xs text-textMuted">
            {licenses.length} options
          </span>
        </div>
        <p className="text-xs text-textMuted">
          Select a license to mint for this IP
        </p>
      </div>

      <div className="p-2">
        {licenses.map((license) => (
          <div
            key={license.id}
            className={`mb-2 rounded-md border overflow-hidden transition-colors ${
              selectedLicense === license.id
                ? "border-accentPurple"
                : "border-border"
            }`}
          >
            <div
              className={`p-2 flex items-center justify-between cursor-pointer ${
                selectedLicense === license.id
                  ? "bg-accentPurple/5"
                  : "bg-background"
              }`}
              onClick={() => handleLicenseSelect(license.id)}
            >
              <div className="flex items-center">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center mr-2 ${
                    selectedLicense === license.id
                      ? "bg-accentPurple text-white"
                      : "border border-border"
                  }`}
                >
                  {selectedLicense === license.id && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium">{license.displayName}</p>
                  <p className="text-xs text-textMuted">
                    {license.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-3">
                  <p className="text-xs font-medium">
                    {formatMintingFee(license.terms.defaultMintingFee)} $IP
                  </p>
                  <p className="text-xs text-textMuted">
                    (~{formatUSD(license.usdPrice || 0)})
                  </p>
                </div>
                <button
                  className="p-1 text-textMuted hover:text-textPrimary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandLicense(license.id);
                  }}
                >
                  {expandedLicense === license.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedLicense === license.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    height: { type: "spring", bounce: 0.2 },
                  }}
                  className="border-t border-border"
                >
                  <div className="p-2 bg-background/50">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                      <LicenseTermItem
                        label="Transferable"
                        value={license.terms.transferable ? "Yes" : "No"}
                        positive={license.terms.transferable}
                      />
                      <LicenseTermItem
                        label="Commercial Use"
                        value={
                          license.terms.commercialUse
                            ? "Allowed"
                            : "Not Allowed"
                        }
                        positive={license.terms.commercialUse}
                      />
                      <LicenseTermItem
                        label="Revenue Share"
                        value={formatRevShare(license.terms.commercialRevShare)}
                        neutral
                      />
                      <LicenseTermItem
                        label="Expiration"
                        value={formatExpiration(license.terms.expiration)}
                        neutral
                      />
                      <LicenseTermItem
                        label="Derivatives"
                        value={
                          license.terms.derivativesAllowed
                            ? "Allowed"
                            : "Not Allowed"
                        }
                        positive={license.terms.derivativesAllowed}
                      />
                      <LicenseTermItem
                        label="Attribution"
                        value={
                          license.offchainTerms !== undefined &&
                          license.offchainTerms.attribution !== undefined
                            ? license.offchainTerms.attribution
                              ? "Required"
                              : "Not Required"
                            : license.terms.commercialAttribution
                              ? "Required"
                              : "Not Required"
                        }
                        positive={
                          license.offchainTerms !== undefined &&
                          license.offchainTerms.attribution !== undefined
                            ? !license.offchainTerms.attribution
                            : !license.terms.commercialAttribution
                        }
                      />

                      {/* Display AI Learning Models permission if off-chain terms are available */}
                      {license.offchainTerms && (
                        <LicenseTermItem
                          label="AI Training"
                          value={
                            license.offchainTerms.aiLearningModels
                              ? "Allowed"
                              : "Not Allowed"
                          }
                          positive={license.offchainTerms.aiLearningModels}
                        />
                      )}
                    </div>

                    {/* Compact organized sections with inline headers */}
                    <div className="mt-2 space-y-1.5">
                      {/* Territory and Channels on the same row */}
                      <div className="grid grid-cols-2 gap-1">
                        {/* Territory */}
                        <div>
                          <p className="text-xs text-textMuted font-medium mb-0.5 flex items-center">
                            <Globe className="h-3 w-3 mr-1" /> Territory:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-accentPurple/10 text-accentPurple px-2 py-0.5 rounded-full">
                              {license.offchainTerms &&
                              license.offchainTerms.territory &&
                              license.offchainTerms.territory.length > 0
                                ? license.offchainTerms.territory.join(", ")
                                : "Global"}
                            </span>
                          </div>
                        </div>

                        {/* Channels */}
                        <div>
                          <p className="text-xs text-textMuted font-medium mb-0.5 flex items-center">
                            <ArrowRight className="h-3 w-3 mr-1" />{" "}
                            Distribution:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {license.offchainTerms &&
                            license.offchainTerms.channelsOfDistribution &&
                            license.offchainTerms.channelsOfDistribution
                              .length > 0 ? (
                              license.offchainTerms.channelsOfDistribution.map(
                                (channel) => (
                                  <span
                                    key={channel}
                                    className="text-xs bg-accentGreen/10 text-accentGreen px-2 py-0.5 rounded-full"
                                  >
                                    {channel}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-xs bg-accentGreen/10 text-accentGreen px-2 py-0.5 rounded-full">
                                All Channels
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Standards on its own row but more compact */}
                      {license.offchainTerms &&
                        license.offchainTerms.contentStandards &&
                        license.offchainTerms.contentStandards.length > 0 && (
                          <div>
                            <p className="text-xs text-textMuted font-medium mb-0.5 flex items-center">
                              <ShieldCheck className="h-3 w-3 mr-1" /> Content
                              Standards:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {license.offchainTerms.contentStandards.map(
                                (standard) => (
                                  <span
                                    key={standard}
                                    className="text-xs bg-accentOrange/10 text-accentOrange px-2 py-0.5 rounded-full"
                                  >
                                    {standard}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                      <button
                        className="text-xs text-accentPurple flex items-center hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // If we have a terms URI, we could open that here
                          if (license.terms.uri) {
                            window.open(license.terms.uri, "_blank");
                          } else {
                            alert("Full license terms not available");
                          }
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View Full Terms
                      </button>

                      <button
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                          selectedLicense === license.id
                            ? "bg-accentPurple text-white"
                            : "bg-gray-200 text-textMuted cursor-not-allowed"
                        }`}
                        disabled={selectedLicense !== license.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedLicense === license.id) {
                            mintLicense(license.id);
                          }
                        }}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Mint License
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper component for license terms
function LicenseTermItem({
  label,
  value,
  positive = false,
  neutral = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-textMuted">{label}:</span>
      <span
        className={`text-xs font-medium ${
          neutral
            ? "text-textPrimary"
            : positive
              ? "text-accentGreen"
              : "text-accentOrange"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
