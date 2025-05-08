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
    // Fetch disputes data from Story Protocol API
    const response = await fetch(`https://api.storyapis.com/api/v3/disputes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": "MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U",
        "X-Chain": "story-aeneid",
      },
      body: JSON.stringify({
        options: {
          where: {
            targetIpId: ipId,
          },
        },
      }),
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch dispute data: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return just the count and the data array for this endpoint
    return NextResponse.json({
      count: data.data?.length || 0,
      disputes: data.data || [],
    });
  } catch (error) {
    console.error("Error fetching dispute data from Story:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispute data from Story Protocol" },
      { status: 500 }
    );
  }
}
