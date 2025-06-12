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

  console.log("Disputes API route called for IP:", ipId);

  try {
    const options = {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.X_API_KEY,
        "X-Chain": process.env.X_CHAIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: {
            limit: 10,
          },
          where: {
            targetIpId: ipId,
          },
        },
      }),
    };

    const response = await fetch(
      "https://api.storyapis.com/api/v3/disputes",
      options
    );

    console.log("disputes response", response);

    if (!response.ok) {
      throw new Error(`Story API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.data);
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json([], { status: 500 });
  }
}
