import { NextRequest, NextResponse } from "next/server";
import { RoyaltyPayment } from "@/types/royalty";
import { getTokenPrice, formatTokenAmount } from "@/lib/tokenPrice";
import { formatEther } from "viem";

// Set cache control headers for 5 minutes (shorter for more real-time data)
export const revalidate = 300; // 5 minutes in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: { ipId: string } }
) {
  const ipId = params.ipId;

  console.log("Royalty API route called for IP:", ipId);

  try {
    const royaltyPayments = await fetchRoyaltyPaymentsFromStory(ipId);
    console.log("Royalty payments fetched:", royaltyPayments.length);
    return NextResponse.json(royaltyPayments);
  } catch (error) {
    console.error("Error fetching royalty payments:", error);
    // Return empty array instead of 500 error
    return NextResponse.json([]);
  }
}

async function fetchRoyaltyPaymentsFromStory(
  ipId: string
): Promise<RoyaltyPayment[]> {
  try {
    // Get the current token price once for all conversions
    const tokenPrice = await getTokenPrice();

    // Make sure env variables are available, use defaults if not
    const apiKey = process.env.X_API_KEY || "MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U"; // Default to public key
    const chain = process.env.X_CHAIN || "story-aeneid"; // Default to testnet

    const response = await fetch(
      "https://api.storyapis.com/api/v3/royalties/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Chain": chain,
        },
        body: JSON.stringify({
          options: {
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: {
              limit: 20, // Get up to 20 recent royalty payments
            },
            where: {
              receiverIpId: ipId,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Story API error: ${response.status} ${response.statusText}`);
      return []; // Return empty array on error instead of throwing
    }

    const data = await response.json();

    // Handle missing data
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid data structure received from Story API:', data);
      return [];
    }

    // Transform API response to match our RoyaltyPayment type
    const royaltyPayments: RoyaltyPayment[] = data.data.map((payment: any) => {
      try {
        // Use safe parsing with fallbacks
        const timestamp = payment.blockTimestamp ? parseInt(payment.blockTimestamp) * 1000 : Date.now();

        // Safely parse amounts with fallbacks
        let amountInIP = 0;
        try {
          amountInIP = parseFloat(formatEther(BigInt(payment.amount || "0")));
        } catch (e) {
          console.error('Error parsing amount:', e);
          // Keep default of 0
        }

        return {
          id: payment.id || `unknown-${Date.now()}`,
          ipId: payment.receiverIpId || ipId,
          fromAddress: payment.sender || "0x0000000000000000000000000000000000000000",
          amount: formatTokenAmount(amountInIP), // Use formatTokenAmount utility
          usdAmount: amountInIP * tokenPrice, // Calculate USD value using current price
          timestamp: timestamp,
          blockNumber: payment.blockNumber ? parseInt(payment.blockNumber) : 0,
          transactionHash: payment.id ? payment.id.split("-")[0] : "0x0", // Often transaction hash is part of the ID
        };
      } catch (error) {
        console.error('Error transforming payment data:', error, payment);
        // Skip this payment by returning null
        return null;
      }
    })
    .filter(payment => payment !== null) as RoyaltyPayment[]; // Filter out null entries

    return royaltyPayments;
  } catch (error) {
    console.error("Error fetching royalty payments from Story:", error);
    return []; // Return empty array instead of throwing
  }
}
