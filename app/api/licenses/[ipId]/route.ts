import { NextRequest, NextResponse } from "next/server";
import { getIPLicensesFromStory } from "@/lib/licenses";
import { DetailedLicenseTerms } from "@/types/license";

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
    // Fetch licenses from Story Protocol API
    const licenses = await getIPLicensesFromStory(ipId);

    if (!licenses || licenses.length === 0) {
      // No licenses found, return empty array with 200 status
      return NextResponse.json([], { status: 200 });
    }

    // Filter out disabled licenses
    const activeLicenses = licenses.filter((license) => !license.disabled);

    return NextResponse.json(activeLicenses);
  } catch (error) {
    console.error("Error fetching licenses from Story:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses from Story Protocol" },
      { status: 500 }
    );
  }
}
