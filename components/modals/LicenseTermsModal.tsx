import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { DetailedLicenseTerms } from "@/types/license";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import { formatUSD } from "@/lib/tokenPrice";
import {
  FileText,
  Info,
  DollarSign,
  Shuffle,
  Clock,
  Tag,
  Award,
  Globe,
  Share2,
  CheckSquare,
  MessageSquare,
  Boxes,
  Radio,
  X,
} from "lucide-react";
import { formatExpiration } from "@/lib/licenses";

// Helper to truncate long text for mobile displays
const truncateText = (text: string, maxLength: number) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

interface LicenseTermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: DetailedLicenseTerms;
}

export function LicenseTermsModal({
  open,
  onOpenChange,
  license,
}: LicenseTermsModalProps) {
  if (!license) return null;

  const { terms, offchainTerms, effectiveTerms } = license;

  // Format revenue share from large number to percentage
  const formatRevShare = (revShare: number): string => {
    if (!revShare) return "0%";
    // API stores percentages multiplied by 10^6 (e.g., 5000000 = 5%)
    return `${(revShare / 1000000).toFixed(2).replace(/\.00$/, "")}%`;
  };

  // Get display name with mobile-friendly truncation
  const displayName = license.displayName || license.licenseTemplate.name;
  const mobileDisplayName = truncateText(displayName, 30);
  const mediumDisplayName = truncateText(displayName, 40);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white p-0 w-[95vw] sm:w-auto mx-auto rounded-md">
        <div className="sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b p-3 sm:p-4">
          <DialogHeader className="mb-0">
            <div className="flex flex-col gap-1.5 sm:gap-2 pr-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-accentPurple" />
                <DialogTitle className="text-sm sm:text-base md:text-lg font-bold gradient-text whitespace-nowrap">
                  License Terms
                </DialogTitle>
              </div>
              <Badge
                variant="outline"
                className="bg-accentPurple/10 text-accentPurple border-accentPurple/20 text-[9px] sm:text-xs md:text-sm truncate max-w-[90%] sm:max-w-[90%] md:max-w-[90%] py-0.5 self-start"
              >
                <span className="hidden md:inline">{displayName}</span>
                <span className="hidden sm:inline md:hidden">
                  {mediumDisplayName}
                </span>
                <span className="sm:hidden">{mobileDisplayName}</span>
              </Badge>
            </div>
          </DialogHeader>

          <DialogClose className="absolute right-3 top-3 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center bg-white/80 border border-gray-200 hover:bg-gray-100">
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-0 md:px-5 md:pb-5 md:pt-0 space-y-3 sm:space-y-4">
          {/* Description Section */}
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 border-b pb-2 sm:pb-3 mt-0">
            {license.description ||
              "This license grants specific rights to use the intellectual property as detailed below."}
          </p>

          {/* Core Terms - Compact 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Key Commercial Terms */}
              <section>
                <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Commercial Terms
                </h3>
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Commercial Use
                      </h4>
                      <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        {terms.commercialUse ? "Allowed" : "Not allowed"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Revenue Share
                      </h4>
                      <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        {formatRevShare(effectiveTerms.commercialRevShare)}
                        {terms.commercialRevCeiling > 0 &&
                          ` (capped at ${terms.commercialRevCeiling})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Minting Fee
                      </h4>
                      <div className="text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        <p>
                          {formatEther(
                            BigInt(effectiveTerms.defaultMintingFee || 0)
                          )}{" "}
                          $IP
                          <span className="text-textMuted ml-1">
                            ({formatUSD(license.usdPrice || 0)})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Expiration
                      </h4>
                      <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        {terms.expiration > 0
                          ? formatExpiration(terms.expiration)
                          : "Never expires"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Territory & Distribution */}
              <section>
                <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Territory & Distribution
                </h3>
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Territory
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1 sm:gap-1.5">
                        {offchainTerms?.territory?.length > 0 ? (
                          offchainTerms.territory.map((area, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] sm:text-[10px] md:text-xs py-0"
                            >
                              {area}
                            </Badge>
                          ))
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] sm:text-[10px] md:text-xs py-0"
                          >
                            Global
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Distribution Channels
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1 sm:gap-1.5">
                        {offchainTerms?.channelsOfDistribution?.length > 0 ? (
                          offchainTerms.channelsOfDistribution.map(
                            (channel, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] sm:text-[10px] md:text-xs py-0"
                              >
                                {channel}
                              </Badge>
                            )
                          )
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] sm:text-[10px] md:text-xs py-0"
                          >
                            All Channels
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Derivative & Rights */}
              <section>
                <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Derivative & Rights
                </h3>
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Shuffle className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Derivatives
                      </h4>
                      <div className="flex flex-col text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        <span>
                          Creation:{" "}
                          {terms.derivativesAllowed ? "Allowed" : "Not allowed"}
                        </span>
                        <span>
                          Approval:{" "}
                          {terms.derivativesApproval
                            ? "Required"
                            : "Not required"}
                        </span>
                        <span>
                          Reciprocal:{" "}
                          {terms.derivativesReciprocal
                            ? "Allowed"
                            : "Not allowed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Attribution
                      </h4>
                      <div className="flex flex-col text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        <span>
                          Original Work:{" "}
                          {offchainTerms?.attribution !== undefined
                            ? offchainTerms.attribution
                              ? "Required"
                              : "Not required"
                            : "Not specified"}
                        </span>
                        <span>
                          Commercial Use:{" "}
                          {terms.commercialAttribution
                            ? "Required"
                            : "Not required"}
                        </span>
                        <span>
                          Derivatives:{" "}
                          {terms.derivativesAttribution
                            ? "Required"
                            : "Not required"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        License Rights
                      </h4>
                      <div className="flex flex-col text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        <span>
                          Transferable: {terms.transferable ? "Yes" : "No"}
                        </span>
                        <span>
                          Sublicensable:{" "}
                          {offchainTerms?.sublicensable !== undefined
                            ? offchainTerms.sublicensable
                              ? "Yes"
                              : "No"
                            : "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(offchainTerms?.aiLearningModels !== undefined ||
                    offchainTerms?.restrictionOnCrossPlatformUse !==
                      undefined) && (
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Boxes className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                          Technology Use
                        </h4>
                        <div className="flex flex-col text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                          {offchainTerms?.aiLearningModels !== undefined && (
                            <span>
                              AI Learning:{" "}
                              {offchainTerms.aiLearningModels
                                ? "Allowed"
                                : "Not allowed"}
                            </span>
                          )}
                          {offchainTerms?.restrictionOnCrossPlatformUse !==
                            undefined && (
                            <span>
                              Cross-Platform:{" "}
                              {offchainTerms.restrictionOnCrossPlatformUse
                                ? "Restricted"
                                : "Allowed"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Content Standards */}
              {offchainTerms?.contentStandards?.length > 0 && (
                <section>
                  <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Content Standards
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <CheckSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <div className="mt-1 flex flex-wrap gap-1 sm:gap-1.5">
                        {offchainTerms.contentStandards.map(
                          (standard, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] sm:text-[10px] md:text-xs py-0"
                            >
                              {standard}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Governing Law */}
              {offchainTerms?.governingLaw && (
                <section>
                  <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Legal
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-xs md:text-sm font-medium">
                        Governing Law
                      </h4>
                      <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500">
                        {offchainTerms.governingLaw}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Additional Parameters */}
          {offchainTerms?.additionalParameters &&
            Object.keys(offchainTerms.additionalParameters).length > 0 && (
              <section className="border-t mt-3 sm:mt-4 pt-3 sm:pt-4">
                <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Additional Parameters
                </h3>
                <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1.5 sm:gap-y-2">
                  {Object.entries(offchainTerms.additionalParameters).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[10px] sm:text-[10px] md:text-xs font-medium text-gray-700">
                          {key}:
                        </span>
                        <span className="text-[10px] sm:text-[10px] md:text-xs text-gray-600">
                          {String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {/* License Links */}
          <section className="border-t mt-3 sm:mt-4 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
              <div>
                <a
                  href="https://github.com/piplabs/pil-document/blob/main/Story%20Foundation%20-%20Programmable%20IP%20License%20(1.31.25).pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 hover:text-indigo-800 text-[10px] sm:text-xs"
                >
                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                  <span>View Legal Document</span>
                </a>
              </div>

              <div className="flex items-center bg-amber-50 text-amber-800 rounded px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[8px] sm:text-[9px] md:text-xs max-w-full sm:max-w-[50%]">
                <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span>Simplified summary. See legal docs for full terms.</span>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
