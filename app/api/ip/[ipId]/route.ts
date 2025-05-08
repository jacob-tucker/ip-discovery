import { NextRequest, NextResponse } from "next/server";
import { getIPAssetMetadataFromStory } from "@/lib/data";
import { IPAsset } from "@/types/ip";

// Set cache control headers for 15 minutes
export const revalidate = 900; // 15 minutes in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  // Await params before using its properties
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;

  try {
    // Try to fetch from the Story API
    const metadata = await getIPAssetMetadataFromStory(ipId);

    if (!metadata || !metadata.metadataUri) {
      // No metadata or URI available, return 404
      return NextResponse.json(
        { error: "IP asset not found in Story Protocol" },
        { status: 404 }
      );
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

      // Construct the IPAsset with defaults for missing fields
      const ipAsset: IPAsset = {
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
        metadataUri: metadataUri,
      };

      return NextResponse.json(ipAsset);
    } catch (error) {
      console.error("Error fetching metadata from URI:", error);
      return NextResponse.json(
        { error: "Failed to fetch metadata from URI" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching IP asset from Story:", error);
    return NextResponse.json(
      { error: "Failed to fetch IP asset from Story Protocol" },
      { status: 500 }
    );
  }
}

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
