"use client";

import { useState } from "react";
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
} from "lucide-react";
import { IPAsset } from "@/types/ip";

interface IPLicensesProps {
  ip: IPAsset;
}

interface License {
  id: string;
  name: string;
  price: number;
  usdPrice: number;
  description: string;
  terms: {
    transferable: boolean;
    defaultMintingFee: number;
    expiration: string;
    commercialUse: boolean;
    commercialAttribution: boolean;
    commercialRevShare: number;
    derivativesAllowed: boolean;
    derivativesAttribution: boolean;
    derivativesApproval: boolean;
    derivativesReciprocal: boolean;
    territory: string;
    channelsOfDistribution: string[];
    contentStandards: string[];
  };
}

export default function IPLicenses({ ip }: IPLicensesProps) {
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [expandedLicense, setExpandedLicense] = useState<string | null>(null);

  // Mock license data
  const licenses: License[] = [
    {
      id: "license-1",
      name: "Basic License",
      price: 50,
      usdPrice: 2.5,
      description: "Basic non-commercial use of IP",
      terms: {
        transferable: true,
        defaultMintingFee: 50,
        expiration: "1 year",
        commercialUse: false,
        commercialAttribution: true,
        commercialRevShare: 0,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: false,
        derivativesReciprocal: true,
        territory: "Global",
        channelsOfDistribution: ["Digital", "Social Media"],
        contentStandards: ["No-Hate", "Suitable-for-All-Ages"],
      },
    },
    {
      id: "license-2",
      name: "Commercial License",
      price: 500,
      usdPrice: 25,
      description: "Full commercial use with revenue sharing",
      terms: {
        transferable: true,
        defaultMintingFee: 500,
        expiration: "2 years",
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 10,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: true,
        derivativesReciprocal: false,
        territory: "Global",
        channelsOfDistribution: [
          "Digital",
          "Physical",
          "Social Media",
          "Print",
        ],
        contentStandards: ["No-Hate", "No-Pornography"],
      },
    },
    {
      id: "license-3",
      name: "Enterprise License",
      price: 2000,
      usdPrice: 100,
      description: "Unlimited commercial use with minimal restrictions",
      terms: {
        transferable: true,
        defaultMintingFee: 2000,
        expiration: "5 years",
        commercialUse: true,
        commercialAttribution: false,
        commercialRevShare: 5,
        derivativesAllowed: true,
        derivativesAttribution: false,
        derivativesApproval: false,
        derivativesReciprocal: false,
        territory: "Global",
        channelsOfDistribution: ["All Channels"],
        contentStandards: ["No-Hate"],
      },
    },
  ];

  const handleLicenseSelect = (licenseId: string) => {
    setSelectedLicense(licenseId === selectedLicense ? null : licenseId);
  };

  const toggleExpandLicense = (licenseId: string) => {
    setExpandedLicense(licenseId === expandedLicense ? null : licenseId);
  };

  const mintLicense = (licenseId: string) => {
    // In a real app, this would call a contract
    console.log(`Minting license ${licenseId}`);
    alert(`License ${licenseId} would be minted in a real app`);
  };

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
                  <p className="text-xs font-medium">{license.name}</p>
                  <p className="text-xs text-textMuted">
                    {license.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-3">
                  <p className="text-xs font-medium">{license.price} $IP</p>
                  <p className="text-xs text-textMuted">
                    (~${license.usdPrice})
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
                        value={`${license.terms.commercialRevShare}%`}
                        neutral
                      />
                      <LicenseTermItem
                        label="Expiration"
                        value={license.terms.expiration}
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
                          license.terms.commercialAttribution
                            ? "Required"
                            : "Not Required"
                        }
                        positive={!license.terms.commercialAttribution}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1 mb-1">
                      <span className="text-xs bg-accentPurple/10 text-accentPurple px-2 py-0.5 rounded-full">
                        {license.terms.territory}
                      </span>
                      {license.terms.channelsOfDistribution
                        .slice(0, 2)
                        .map((channel) => (
                          <span
                            key={channel}
                            className="text-xs bg-accentGreen/10 text-accentGreen px-2 py-0.5 rounded-full"
                          >
                            {channel}
                          </span>
                        ))}
                      {license.terms.channelsOfDistribution.length > 2 && (
                        <span className="text-xs text-textMuted">
                          +{license.terms.channelsOfDistribution.length - 2}{" "}
                          more
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                      <button
                        className="text-xs text-accentPurple flex items-center hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // In a real app this would open a modal with full license terms
                          alert("This would show the full license terms");
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
