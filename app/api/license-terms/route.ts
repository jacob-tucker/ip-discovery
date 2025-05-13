import {NextRequest, NextResponse} from "next/server"

// Set cache control headers for 15 minutes
export const revalidate = 900 // 15 minutes in seconds

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const requestData = await request.json()
    const {ipIds} = requestData

    const apiKey = process.env.X_API_KEY
    const chain = process.env.X_CHAIN

    console.log(
      "[LICENSE_TERMS_PROXY] Received request for ipIds:",
      JSON.stringify(ipIds),
      "on chain:",
      chain
    )

    if (!apiKey || !chain) {
      console.error(
        "CRITICAL: X_API_KEY or X_CHAIN environment variables are not set in /api/license-terms/route.ts."
      )
      return NextResponse.json(
        {error: "Server configuration error: Missing API credentials."},
        {status: 500}
      )
    }

    if (!ipIds || !Array.isArray(ipIds) || ipIds.length === 0) {
      console.warn(
        "[LICENSE_TERMS_PROXY] Missing or invalid ipIds parameter:",
        ipIds
      )
      return NextResponse.json(
        {error: "Missing or invalid ipIds parameter"},
        {status: 400}
      )
    }
    // Proxy the request to Story Protocol
    const response = await fetch(
      "https://api.storyapis.com/api/v3/detailed-ip-license-terms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Chain": chain,
        },
        body: JSON.stringify({
          options: {
            where: {
              ipIds: ipIds,
            },
          },
        }),
      }
    )

    if (!response.ok) {
      console.error(
        `[LICENSE_TERMS_PROXY] Story API error for ipIds ${JSON.stringify(ipIds)} on chain ${chain}: ${response.status} ${response.statusText}`
      )
      throw new Error(
        `Story API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    console.log(
      `[LICENSE_TERMS_PROXY] Successfully fetched license terms for ipIds: ${JSON.stringify(ipIds)}`
    )
    return NextResponse.json(data)
  } catch (error) {
    console.error(
      "[LICENSE_TERMS_PROXY] Error proxying license terms request:",
      error
    )
    return NextResponse.json(
      {error: "Failed to fetch license terms from Story Protocol"},
      {status: 500}
    )
  }
}
