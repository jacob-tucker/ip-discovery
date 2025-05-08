import { IPAsset } from "@/types/ip";
import { RoyaltyPayment } from "@/types/royalty";
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
    // Fetch from the Story API
    const metadata = await getIPAssetMetadataFromStory(ipId);

    if (!metadata || !metadata.metadataUri) {
      // No metadata or URI available, fall back to local data
      return getIPAssetById(ipId);
    }

    // Store the metadataUri for later use
    const metadataUri = metadata.metadataUri;

    // Fetch JSON from metadataUri
    try {
      const response = await fetch(metadataUri);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch metadata from URI: ${response.status}`
        );
      }

      const metadataJson = await response.json();

      // Return IPAsset with defaults for missing fields
      return {
        ipId: ipId,
        title: metadataJson.title || "Unknown IP",
        description: metadataJson.description || "No description available",
        createdAt: metadataJson.createdAt || new Date().toISOString(),
        image: metadataJson.image || "/placeholder-image.png",
        imageHash: metadataJson.imageHash || "",
        mediaUrl:
          metadataJson.mediaUrl ||
          metadataJson.image ||
          "/placeholder-image.png",
        mediaHash: metadataJson.mediaHash || metadataJson.imageHash || "",
        mediaType:
          metadataJson.mediaType || getMediaType(metadataJson.mediaUrl),
        creators: metadataJson.creators || [],
        ipType: metadataJson.ipType || "Asset",
        metadataUri: metadataUri, // Store the metadataUri in the object
      };
    } catch (error) {
      console.error("Error fetching metadata from URI:", error);
      return getIPAssetById(ipId);
    }
  } catch (error) {
    console.error("Error fetching IP asset from Story:", error);
    return getIPAssetById(ipId);
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
  const allPayments = await getAllRoyaltyPayments();
  const ipPayments = allPayments.filter((payment) => payment.ipId === ipId);

  return limit ? ipPayments.slice(0, limit) : ipPayments;
};
