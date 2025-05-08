import { NextRequest, NextResponse } from "next/server";
import { RoyaltyPayment } from "@/types/royalty";
import { getTokenPrice, formatTokenAmount } from "@/lib/tokenPrice";
import { formatEther } from "viem";

// Set cache control headers for 5 minutes (shorter for more real-time data)
export const revalidate = 300; // 5 minutes in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  // Await params before using its properties
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;

  console.log("Royalty API route called for IP:", ipId);

  try {
    const royaltyPayments = await fetchRoyaltyPaymentsFromStory(ipId);
    console.log("Royalty payments fetched:", royaltyPayments.length);
    return NextResponse.json(royaltyPayments);
  } catch (error) {
    console.error("Error fetching royalty payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch royalty payments from Story Protocol" },
      { status: 500 }
    );
  }
}

async function fetchRoyaltyPaymentsFromStory(
  ipId: string
): Promise<RoyaltyPayment[]> {
  try {
    // Get the current token price once for all conversions
    const tokenPrice = await getTokenPrice();

    const response = await fetch(
      "https://api.storyapis.com/api/v3/royalties/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U",
          "X-Chain": "story",
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
      throw new Error(
        `Failed to fetch royalty payments: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Transform API response to match our RoyaltyPayment type
    const royaltyPayments: RoyaltyPayment[] = data.data.map((payment: any) => {
      // Convert block timestamp (typically in seconds since epoch) to milliseconds
      const timestamp = parseInt(payment.blockTimestamp) * 1000;

      // Convert amount from wei to $IP tokens using viem's formatEther
      const amountInIP = parseFloat(formatEther(BigInt(payment.amount || "0")));

      return {
        id: payment.id,
        ipId: payment.receiverIpId,
        fromAddress: payment.sender,
        amount: formatTokenAmount(amountInIP), // Use formatTokenAmount utility
        usdAmount: amountInIP * tokenPrice, // Calculate USD value using current price
        timestamp: timestamp,
        blockNumber: parseInt(payment.blockNumber),
        transactionHash: payment.id.split("-")[0], // Often transaction hash is part of the ID
      };
    });

    return royaltyPayments;
  } catch (error) {
    console.error("Error fetching royalty payments from Story:", error);
    throw error;
  }
}
