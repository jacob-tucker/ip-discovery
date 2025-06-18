import { DetailedLicenseTerms, LicenseTerms } from "@/types/license";
import { getTokenPrice } from "./tokenPrice";
import { formatEther } from "viem";
import { getBaseUrl } from "./data";

/**
 * Get license data from Story API
 * @param ipId Story IP ID
 * @returns Array of detailed license terms
 */
export async function getIPLicensesFromStory(
  ipId: string
): Promise<DetailedLicenseTerms[]> {
  try {
    const baseUrl = getBaseUrl();

    // Use our proxy API endpoint to handle caching and environment variables
    const response = await fetch(`${baseUrl}/api/license-terms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ipIds: [ipId],
      }),
      // Use Next.js cache with revalidation
      next: { revalidate: 900 }, // 15 minutes, matching the API's revalidate setting
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch license terms: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error("Invalid license data format:", data);
      return [];
    }

    // Enrich licenses with display names and descriptions
    const enrichedLicenses = await Promise.all(
      data.data.map(async (license: DetailedLicenseTerms) => {
        // Store original values
        const originalTerms = {
          defaultMintingFee: license.terms.defaultMintingFee,
          commercialRevShare: license.terms.commercialRevShare,
        };

        // Check for licensing config overrides
        let effectiveMintingFee = license.terms.defaultMintingFee;
        let effectiveRevShare = license.terms.commercialRevShare;
        let hasOverrides = false;

        if (license.licensingConfig?.isSet) {
          const configMintingFee = Number(license.licensingConfig.mintingFee);
          // Only override minting fee if it's different
          if (configMintingFee !== license.terms.defaultMintingFee) {
            effectiveMintingFee = configMintingFee;
            hasOverrides = true;
          }

          // Only override rev share if it's greater than 0 and different from original
          if (
            license.licensingConfig.commercialRevShare > 0 &&
            license.licensingConfig.commercialRevShare !==
              license.terms.commercialRevShare
          ) {
            effectiveRevShare = license.licensingConfig.commercialRevShare;
            hasOverrides = true;
          }
        }

        // Convert effectiveMintingFee from wei to tokens for USD calculation
        const tokenAmount = Number(
          formatEther(BigInt(effectiveMintingFee || 0))
        );

        return {
          ...license,
          ...getLicenseDisplayInfo(license.terms),
          // Keep original terms intact
          terms: {
            ...license.terms,
          },
          // Store effective values separately
          effectiveTerms: {
            defaultMintingFee: effectiveMintingFee,
            commercialRevShare: effectiveRevShare,
          },
          originalTerms: hasOverrides ? originalTerms : undefined,
          hasOverrides,
          usdPrice: tokenAmount * (await getTokenPrice()),
        };
      })
    );

    return enrichedLicenses;
  } catch (error) {
    console.error("Error fetching license terms:", error);
    return [];
  }
}

// PIL flavor types for license categorization
export enum PIL_FLAVOR {
  NON_COMMERCIAL_SOCIAL_REMIXING = "NON_COMMERCIAL_SOCIAL_REMIXING",
  OPEN_USE = "OPEN_USE",
  COMMERCIAL_USE = "COMMERCIAL_USE",
  COMMERCIAL_REMIX = "COMMERCIAL_REMIX",
  CUSTOM = "CUSTOM",
}

/**
 * Normalize revenue share percentage from API format (e.g., 5000000 = 5%)
 * @param revShare Revenue share value from API
 * @returns Normalized percentage (0-100)
 */
export function normalizeRevShare(revShare: number): number {
  return revShare / 1000000;
}

/**
 * Determine PIL flavor based on license terms
 * @param terms License terms to evaluate
 * @returns The corresponding PIL flavor enum value
 */
export function getPilFlavorByLicenseTerms(terms: LicenseTerms): PIL_FLAVOR {
  const {
    commercialUse,
    derivativesAllowed,
    derivativesAttribution,
    commercialRevShare,
  } = terms;

  // Normalize the revenue share percentage (API returns values like 5000000 for 5%)
  const normalizedRevShare = normalizeRevShare(commercialRevShare);

  if (!commercialUse && derivativesAllowed) {
    return derivativesAttribution
      ? PIL_FLAVOR.NON_COMMERCIAL_SOCIAL_REMIXING
      : PIL_FLAVOR.OPEN_USE;
  }

  if (
    commercialUse &&
    !derivativesAllowed &&
    !derivativesAttribution &&
    normalizedRevShare === 0
  ) {
    // Commercial use should check that mintingFee is set
    return PIL_FLAVOR.COMMERCIAL_USE;
  }

  if (
    commercialUse &&
    derivativesAllowed &&
    derivativesAttribution &&
    normalizedRevShare > 0
  ) {
    return PIL_FLAVOR.COMMERCIAL_REMIX;
  }

  return PIL_FLAVOR.CUSTOM;
}

/**
 * Generate display information for a license based on its terms
 * @param terms License terms from the API
 * @returns Display name and description for the license
 */
export function getLicenseDisplayInfo(terms: LicenseTerms): {
  displayName: string;
  description: string;
} {
  // Determine PIL flavor based on license terms
  const pilFlavor = getPilFlavorByLicenseTerms(terms);

  // Default values
  let displayName = "Custom License";
  let description = "Custom license terms for this IP";

  // Set name and description based on PIL flavor
  switch (pilFlavor) {
    case PIL_FLAVOR.NON_COMMERCIAL_SOCIAL_REMIXING:
      displayName = "Non-Commercial Social Remixing";
      description = "Non-commercial use with attribution for derivatives";
      break;

    case PIL_FLAVOR.OPEN_USE:
      displayName = "Open Use";
      description = "Non-commercial use with unrestricted derivatives";
      break;

    case PIL_FLAVOR.COMMERCIAL_USE:
      displayName = "Commercial Use";
      description = "Commercial use without derivatives";
      break;

    case PIL_FLAVOR.COMMERCIAL_REMIX:
      displayName = "Commercial Remix";
      description = "Commercial use with revenue sharing for derivatives";
      break;

    case PIL_FLAVOR.CUSTOM:
    default:
      // Keep default values
      break;
  }

  return { displayName, description };
}

/**
 * Format expiration time from seconds to human-readable string
 * @param expirationSeconds Expiration time in seconds
 * @returns Human-readable expiration string
 */
export function formatExpiration(expirationSeconds: number): string {
  if (!expirationSeconds) return "Never";

  const days = expirationSeconds / (60 * 60 * 24);

  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? "year" : "years"}`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"}`;
  } else {
    return `${Math.floor(days)} days`;
  }
}
