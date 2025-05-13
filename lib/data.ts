import { IPAsset } from "@/types/ip";
import { RoyaltyPayment } from "@/types/royalty";
import { DetailedLicenseTerms } from "@/types/license";
import { featuredIPIds } from "@/data/featured-ipids";

// Helper function to get base URL - used consistently across all functions
export const getBaseUrl = (): string => {
  // For Vercel deployments (production or preview)
  console.log("VERCEL_URL:", `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    // Use HTTPS for production and preview deployments
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Fallback to NEXT_PUBLIC_API_URL for local development or explicit configuration
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  console.log("Base URL:", baseUrl);
  return baseUrl;
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
    const baseUrl = getBaseUrl();

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

export const getAllRoyaltyPayments = async (): Promise<RoyaltyPayment[]> => {
  console.log(
    "Getting all royalty payments - using featured IP IDs from config"
  );

  // Use featured IP IDs instead of the hard-coded assets
  const ipIds = featuredIPIds;

  // Collect royalty data for all IPs
  const allRoyalties: RoyaltyPayment[] = [];

  try {
    // Fetch up to 10 royalty payments for each IP to ensure we have enough data
    const paymentPromises = ipIds.map((ipId) =>
      getRoyaltyPaymentsForIP(ipId, 10)
    );
    const paymentResults = await Promise.all(paymentPromises);

    // Flatten the results and remove empty arrays
    paymentResults.forEach((payments) => {
      if (payments && payments.length > 0) {
        allRoyalties.push(...payments);
      }
    });

    // Sort by timestamp (most recent first) and limit to a reasonable number
    return allRoyalties.sort((a, b) => b.timestamp - a.timestamp).slice(0, 40); // Get 40 payments to ensure we have enough
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
    }).catch((err) => {
      console.error("Fetch error in getRoyaltyPaymentsForIP:", err);
      return new Response(JSON.stringify([]), { status: 200 });
    });

    console.log(
      "getRoyaltyPaymentsForIP API response status:",
      response.status
    );

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }

    // Get response body and handle potential parsing errors
    let payments: RoyaltyPayment[] = [];
    try {
      payments = await response.json();
    } catch (parseError) {
      console.error("JSON parse error in getRoyaltyPaymentsForIP:", parseError);
      return [];
    }

    // Handle if response is not an array
    if (!Array.isArray(payments)) {
      console.error("Expected array of payments but got:", typeof payments);
      return [];
    }

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
