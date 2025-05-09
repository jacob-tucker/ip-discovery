import { NextRequest, NextResponse } from "next/server";
import { featuredIPIds } from "@/data/featured-ipids";
import { getStoryIPAssetById } from "@/lib/data";
import { IPAsset } from "@/types/ip";

// Set cache control headers for 5 minutes
export const revalidate = 300; // 5 minutes in seconds

export async function GET(_request: NextRequest) {
  try {
    // Fetch all featured IP assets in parallel
    const ipPromises = featuredIPIds.map((ipId) => getStoryIPAssetById(ipId));
    const ipAssets = await Promise.all(ipPromises);

    // Filter out any null results (failed fetches)
    const validIpAssets = ipAssets.filter(
      (asset) => asset !== null
    ) as IPAsset[];

    // Return the results
    return NextResponse.json(validIpAssets);
  } catch (error) {
    console.error("Error fetching featured IP assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured IP assets" },
      { status: 500 }
    );
  }
}
