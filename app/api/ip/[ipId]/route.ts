import { NextRequest, NextResponse } from "next/server";
import { IPAsset } from "@/types/ip";

// Set cache control headers for 15 minutes
export const revalidate = 900; // 15 minutes in seconds

// Helper function to transform IPFS URLs safely
function transformIpfsUrl(url: string): string {
  if (!url) return url;
  // Convert ipfs:// to https://ipfs.io/ipfs/
  return url.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${url.substring(7)}`
    : url;
}

// Helper function to determine media type from URL using extension
function getMediaType(url?: string): string {
  if (!url) return "image/png";

  const extensions = {
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };

  for (const [ext, type] of Object.entries(extensions)) {
    if (url.endsWith(ext)) return type;
  }

  return "image/png"; // Default when type can't be determined
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;
  const origin = request.nextUrl.origin;
  const storyApiKey = "MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U";

  try {
    // Step 1: Try to get metadata URI and asset data
    let metadataUri, tokenUri, assetData, metadataJson;
    let actualFetchUri; // Track the URI we actually fetch from

    // First try the metadata endpoint
    try {
      const metadataResponse = await fetch(
        `https://api.storyapis.com/api/v3/assets/${ipId}/metadata`,
        {
          headers: {
            "X-Api-Key": storyApiKey,
            "X-Chain": "story",
          },
          next: { revalidate },
        }
      );

      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        metadataUri = metadata?.metadataUri;
      } else {
        throw new Error(
          `Metadata endpoint failed: ${metadataResponse.statusText}`
        );
      }
    } catch (metadataError) {
      console.warn("Metadata endpoint failed, trying asset data as fallback");

      // Try getting asset data for token URI
      try {
        const assetResponse = await fetch(`${origin}/api/assets/${ipId}`);
        if (!assetResponse.ok) {
          throw new Error(`Asset endpoint failed: ${assetResponse.statusText}`);
        }

        const responseData = await assetResponse.json();
        assetData = responseData.data;

        // Get tokenUri from NFT metadata if available
        if (assetData?.nftMetadata?.tokenUri) {
          tokenUri = assetData.nftMetadata.tokenUri;
          console.log("Found tokenUri in NFT metadata");
        }
      } catch (assetError) {
        console.error("Both metadata and asset endpoints failed");
      }
    }

    // If no URI available, return 404
    if (!metadataUri && !tokenUri) {
      return NextResponse.json(
        { error: "IP asset not found or doesn't have metadata" },
        { status: 404 }
      );
    }

    // Step 2: Fetch and process metadata content
    try {
      // Select the URI to use, prioritizing metadataUri over tokenUri, and transform it
      const uriToFetch = transformIpfsUrl(metadataUri || tokenUri);
      actualFetchUri = uriToFetch; // Store for later use
      console.log("Fetching metadata from:", uriToFetch);

      const metadataResponse = await fetch(uriToFetch);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
      }

      metadataJson = await metadataResponse.json();
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return NextResponse.json(
        { error: "Failed to fetch metadata content" },
        { status: 404 }
      );
    }

    // Step 3: Process images and media URLs
    let image = metadataJson.image
      ? transformIpfsUrl(metadataJson.image)
      : null;
    let mediaUrl = metadataJson.mediaUrl
      ? transformIpfsUrl(metadataJson.mediaUrl)
      : null;

    // If no image found, try to get it from asset data
    if (!image) {
      // If we don't already have asset data, fetch it now
      if (!assetData) {
        try {
          const assetResponse = await fetch(`${origin}/api/assets/${ipId}`);
          if (assetResponse.ok) {
            const responseData = await assetResponse.json();
            assetData = responseData.data;
          }
        } catch (err) {
          console.warn("Failed to fetch asset data for image");
        }
      }

      // Extract image from NFT metadata if available
      if (assetData?.nftMetadata?.imageUrl) {
        image = transformIpfsUrl(assetData.nftMetadata.imageUrl);
        console.log("Using NFT metadata image");

        // If no media URL was specified, use the NFT image for that too
        if (!mediaUrl) {
          mediaUrl = image;
        }
      }
    }

    // Set fallback values for image and media
    image = image || "/placeholder-image.png";
    mediaUrl = mediaUrl || image;

    // Step 4: Construct and return the IP asset
    const ipAsset: IPAsset = {
      ipId,
      title: metadataJson.title || metadataJson.name || "Unknown IP",
      description: metadataJson.description || "No description available",
      createdAt:
        metadataJson.createdAt || String(Math.floor(Date.now() / 1000)), // Unix timestamp in seconds
      image,
      imageHash: metadataJson.imageHash || "",
      mediaUrl,
      mediaHash: metadataJson.mediaHash || metadataJson.imageHash || "",
      mediaType: metadataJson.mediaType || getMediaType(mediaUrl),
      creators: metadataJson.creators || [],
      ipType: metadataJson.ipType || "Asset",
      metadataUri: actualFetchUri, // Use the URI we actually fetched from
    };

    return NextResponse.json(ipAsset);
  } catch (error) {
    console.error("Error processing IP asset:", error);
    return NextResponse.json(
      { error: "Failed to process IP asset data" },
      { status: 500 }
    );
  }
}
