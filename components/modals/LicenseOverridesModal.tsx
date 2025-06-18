import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailedLicenseTerms } from "@/types/license";
import { formatEther } from "viem";

interface LicenseOverridesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: DetailedLicenseTerms;
}

export function LicenseOverridesModal({
  open,
  onOpenChange,
  license,
}: LicenseOverridesModalProps) {
  // Format minting fee from wei to tokens with no trailing zeros
  const formatMintingFee = (fee: string | number | undefined): string => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>License Configuration Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Minting Fee Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Minting Fee</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-textMuted">Original Value:</p>
                <p className="font-medium">
                  {formatMintingFee(license.originalTerms?.defaultMintingFee)}{" "}
                  $IP
                </p>
              </div>
              <div>
                <p className="text-textMuted">Current Value:</p>
                <p className="font-medium text-accentPurple">
                  {formatMintingFee(license.effectiveTerms.defaultMintingFee)}{" "}
                  $IP
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Share Section */}
          {license.licensingConfig?.commercialRevShare > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Revenue Share</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-textMuted">Original Value:</p>
                  <p className="font-medium">
                    {formatRevShare(license.originalTerms?.commercialRevShare)}
                  </p>
                </div>
                <div>
                  <p className="text-textMuted">Current Value:</p>
                  <p className="font-medium text-accentPurple">
                    {formatRevShare(license.effectiveTerms.commercialRevShare)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-background/50 rounded-md border border-border">
            <p className="text-xs text-textMuted">
              These values have been modified by the IP owner through the
              licensing configuration. The current values are the ones that will
              be applied when minting this license.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
