import { IPAsset } from "@/types/ip";
import { RoyaltyPayment } from "@/types/royalty";
import { DetailedLicenseTerms } from "@/types/license";
import ipAssets from "@/data/ip-assets.json";
import royaltyPayments from "@/data/royalty-payments.json";

// Enrich local data with ipId (using title as a fallback)
const enrichedIPAssets = ipAssets.map((asset) => ({
  ...asset,
  ipId: asset.ipId || asset.title, // Ensure ipId exists
}));

export const getIPAssets = async (): Promise<IPAsset[]> => {
  return enrichedIPAssets as IPAsset[];
};

export const getIPAssetById = async (ipId: string): Promise<IPAsset | null> => {
  const assets = await getIPAssets();
  return (
    assets.find(
      (asset) => asset.ipId === ipId // Strict matching by ipId only
    ) || null
  );
};

export const getIPAssetMetadataFromStory = async (
  ipId: string
): Promise<any> => {
  try {
    const response = await fetch(
      `https://api.storyapis.com/api/v3/assets/${ipId}/metadata`,
      {
        headers: {
          "X-Api-Key": "MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U",
          "X-Chain": "story",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch IP asset metadata: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching IP asset metadata:", error);
    throw error;
  }
};

export const getStoryIPAssetById = async (
  ipId: string
): Promise<IPAsset | null> => {
  try {
    // Fetch from our API endpoint which handles caching
    const response = await fetch(`/api/ip/${ipId}`, {
      // Use Next.js cache: 'force-cache' for maximum caching
      // or use 'no-store' to bypass the cache
      next: { revalidate: 900 }, // 15 minutes, matching the API's revalidate setting
    });

    console.log("response", response);

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      // No fallback to mock data
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching IP asset via API:", error);
    // No fallback to mock data
    return null;
  }
};

// Helper function to determine media type
function getMediaType(url?: string): string {
  if (!url) return "image/png";

  if (url.endsWith(".mp3")) return "audio/mpeg";
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".webm")) return "video/webm";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".gif")) return "image/gif";
  if (url.endsWith(".svg")) return "image/svg+xml";

  // Default to image/png if type can't be determined
  return "image/png";
}

export const getAllRoyaltyPayments = async (): Promise<RoyaltyPayment[]> => {
  // Sort by timestamp in descending order (most recent first)
  return (royaltyPayments as RoyaltyPayment[]).sort(
    (a, b) => b.timestamp - a.timestamp
  );
};

export const getRoyaltyPaymentsForIP = async (
  ipId: string,
  limit?: number
): Promise<RoyaltyPayment[]> => {
  console.log(
    "getRoyaltyPaymentsForIP called for IP:",
    ipId,
    "with limit:",
    limit
  );

  try {
    // Fetch from our API endpoint which handles caching
    const response = await fetch(`/api/royalties/${ipId}`, {
      next: { revalidate: 300 }, // 5 minutes, matching the API's revalidate setting
    });

    console.log(
      "getRoyaltyPaymentsForIP API response status:",
      response.status
    );

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const payments = await response.json();
    console.log(
      "getRoyaltyPaymentsForIP data received:",
      payments.length,
      "payments"
    );

    // Apply limit if requested
    return limit ? payments.slice(0, limit) : payments;
  } catch (error) {
    console.error("Error fetching royalty payments via API:", error);
    return [];
  }
};

/**
 * Get license terms for a specific IP asset
 * @param ipId IP asset ID
 * @returns Array of license terms
 */
export const getLicensesForIP = async (
  ipId: string
): Promise<DetailedLicenseTerms[]> => {
  console.log("getLicensesForIP called for IP:", ipId);

  try {
    // Fetch from our API endpoint which handles caching
    const response = await fetch(`/api/licenses/${ipId}`, {
      next: { revalidate: 900 }, // 15 minutes, matching the API's revalidate setting
    });

    console.log("getLicensesForIP API response status:", response.status);

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const licenses = await response.json();
    console.log("getLicensesForIP data received:", licenses.length, "licenses");

    return licenses;
  } catch (error) {
    console.error("Error fetching licenses via API:", error);
    return [];
  }
};
