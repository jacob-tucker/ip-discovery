import { DetailedLicenseTerms, LicenseTerms } from "@/types/license";
import { getTokenPrice } from "./tokenPrice";
import { formatEther } from "viem";

/**
 * Get license data from Story Protocol API
 * @param ipId Story Protocol IP ID
 * @returns Array of detailed license terms
 */
export async function getIPLicensesFromStory(
  ipId: string
): Promise<DetailedLicenseTerms[]> {
  try {
    const response = await fetch(
      "https://api.storyapis.com/api/v3/detailed-ip-license-terms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.X_API_KEY,
          "X-Chain": process.env.X_CHAIN,
        },
        body: JSON.stringify({
          options: {
            where: {
              ipIds: [ipId],
            },
          },
        }),
      }
    );

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
        // Convert defaultMintingFee from wei to tokens for USD calculation
        const tokenAmount = Number(
          formatEther(BigInt(license.terms.defaultMintingFee || 0))
        );

        return {
          ...license,
          ...getLicenseDisplayInfo(license.terms),
          // Calculate USD price based on token amount
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
