import { NextRequest, NextResponse } from "next/server";
import { getAllRoyaltyPayments, getStoryIPAssetById } from "@/lib/data";
import { RoyaltyPayment } from "@/types/royalty";

// Set cache control headers for 5 minutes
export const revalidate = 300; // 5 minutes in seconds

export async function GET(request: NextRequest) {
  try {
    // Get the limit parameter from the URL, defaulting to 20
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Fetch all royalty payments (the function in data.ts already sorts and limits to 40)
    const allRoyaltyPayments = await getAllRoyaltyPayments();

    // Apply the requested limit
    const limitedPayments =
      limit > 0 ? allRoyaltyPayments.slice(0, limit) : allRoyaltyPayments;

    // Get unique IP IDs to fetch titles
    const uniqueIpIds = Array.from(
      new Set(limitedPayments.map((payment) => payment.ipId))
    );

    // Create a mapping of IP IDs to titles
    const ipTitles: Record<string, string> = {};

    // Fetch all IP titles in parallel
    const ipPromises = uniqueIpIds.map(async (ipId) => {
      try {
        const ipAsset = await getStoryIPAssetById(ipId);
        if (ipAsset) {
          ipTitles[ipId] = ipAsset.title;
        } else {
          ipTitles[ipId] = "Unknown IP";
        }
      } catch (error) {
        console.error(`Error fetching IP title for ${ipId}:`, error);
        ipTitles[ipId] = "Unknown IP";
      }
    });

    // Wait for all IP title fetches to complete
    await Promise.all(ipPromises);

    // Enrich payments with IP titles
    const enrichedPayments = limitedPayments.map((payment) => ({
      ...payment,
      ipTitle: ipTitles[payment.ipId] || "Unknown IP",
    }));

    // Return the enriched results
    return NextResponse.json(enrichedPayments);
  } catch (error) {
    console.error("Error fetching royalty payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch royalty payments" },
      { status: 500 }
    );
  }
}
