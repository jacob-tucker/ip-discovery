import { NextRequest, NextResponse } from "next/server";

// Set cache control headers for 5 minutes
export const revalidate = 300; // 5 minutes in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  // Await params before using its properties
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;

  try {
    // Fetch asset data from Story API
    const response = await fetch(
      `https://api.storyapis.com/api/v3/assets/${ipId}`,
      {
        headers: {
          "X-Api-Key": process.env.X_API_KEY,
          "X-Chain": process.env.X_CHAIN,
        },
        next: { revalidate },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch asset data: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching asset data from Story:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset data from Story" },
      { status: 500 }
    );
  }
}
