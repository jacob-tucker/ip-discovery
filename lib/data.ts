import { IPAsset } from "@/types/ip";
import { RoyaltyPayment } from "@/types/royalty";
import { DetailedLicenseTerms } from "@/types/license";
import { featuredIPIds } from "@/data/featured-ipids";

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

/**
 * Get detailed asset data from Story Protocol API, including derivative counts
 */
export const getAssetDataFromStory = async (
  ipId: string
): Promise<{
  descendantCount: number;
  childrenCount: number;
  ancestorCount: number;
  [key: string]: any;
} | null> => {
  try {
    // Determine if we're in a browser or server environment
    const isServer = typeof window === "undefined";
    const baseUrl = isServer
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"
      : "";

    // Fetch from our API endpoint which handles caching
    const response = await fetch(`${baseUrl}/api/assets/${ipId}`, {
      next: { revalidate: 300 }, // 5 minutes, matching the API's revalidate setting
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.data; // The Story API wraps the data in a data property
  } catch (error) {
    console.error("Error fetching asset data via API:", error);
    return null;
  }
};

// Helper function to get base URL
const getBaseUrl = (): string => {
  const isServer = typeof window === "undefined";
  return isServer
    ? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
    : "";
};

export const getStoryIPAssetById = async (
  ipId: string
): Promise<IPAsset | null> => {
  try {
    const baseUrl = getBaseUrl();

    // Fetch from our API endpoint which handles caching
    const response = await fetch(`${baseUrl}/api/ip/${ipId}`, {
      // Use Next.js cache with revalidation to balance freshness with performance
      next: { revalidate: 900 }, // 15 minutes, matching the API's revalidate setting
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching IP asset ${ipId} via API:`, error);
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
  console.log(
    "Getting all royalty payments - using featured IP IDs from config"
  );

  // Use featured IP IDs instead of the hard-coded assets
  const ipIds = featuredIPIds;

  // Collect royalty data for all IPs
  const allRoyalties: RoyaltyPayment[] = [];

  try {
    // Fetch up to 3 royalty payments for each IP to keep the list manageable
    const paymentPromises = ipIds.map((ipId) =>
      getRoyaltyPaymentsForIP(ipId, 3)
    );
    const paymentResults = await Promise.all(paymentPromises);

    // Flatten the results and remove empty arrays
    paymentResults.forEach((payments) => {
      if (payments && payments.length > 0) {
        allRoyalties.push(...payments);
      }
    });

    // Sort by timestamp (most recent first) and limit to a reasonable number
    return allRoyalties.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20); // Limit to 20 payments total
  } catch (error) {
    console.error("Error fetching global royalty payments:", error);
    return []; // Return empty array if there's an error
  }
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
    const baseUrl = getBaseUrl();

    // Fetch from our API endpoint which handles caching
    const response = await fetch(`${baseUrl}/api/royalties/${ipId}`, {
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
    const baseUrl = getBaseUrl();

    // Fetch from our API endpoint which handles caching
    const response = await fetch(`${baseUrl}/api/licenses/${ipId}`, {
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

/**
 * Get dispute data for a specific IP asset
 * @param ipId IP asset ID
 * @returns Number of disputes raised for the IP
 */
export const getDisputesForIP = async (ipId: string): Promise<number> => {
  try {
    const baseUrl = getBaseUrl();

    // Fetch from our API endpoint which handles caching
    const response = await fetch(`${baseUrl}/api/disputes/${ipId}`, {
      next: { revalidate: 300 }, // 5 minutes, matching the API's revalidate setting
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error("Error fetching disputes via API:", error);
    return 0;
  }
};
