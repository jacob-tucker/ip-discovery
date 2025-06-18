import { NextRequest, NextResponse } from "next/server";

// Set cache control headers for 15 minutes
export const revalidate = 900; // 15 minutes in seconds

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const requestData = await request.json();
    const { ipIds } = requestData;

    if (!ipIds || !Array.isArray(ipIds) || ipIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid ipIds parameter" },
        { status: 400 }
      );
    }
    // Proxy the request to Story
    const response = await fetch(
      "https://api.storyapis.com/api/v3/detailed-ip-license-terms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.X_API_KEY,
          "X-Chain": process.env.X_CHAIN,
        },
        body: JSON.stringify({
          options: {
            where: {
              ipIds: ipIds,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Story API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying license terms request:", error);
    return NextResponse.json(
      { error: "Failed to fetch license terms from Story" },
      { status: 500 }
    );
  }
}
