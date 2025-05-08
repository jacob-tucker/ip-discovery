/**
 * Utility module for managing Story Protocol token prices
 * Uses StoryScan API to fetch real-time price data
 */

// Cache for IP token price to avoid multiple fetches in a short time
let cachedTokenPrice: { price: number; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 60 * 1000; // 1 minute cache for price
const DEFAULT_IP_PRICE = 4.13; // Default fallback price

/**
 * Fetches the current $IP token price
 * Uses cached value if available and not expired
 * @returns Current $IP price in USD
 */
export async function getTokenPrice(): Promise<number> {
  // Check if we have a recent cached price
  const now = Date.now();
  if (cachedTokenPrice && now - cachedTokenPrice.timestamp < PRICE_CACHE_TTL) {
    return cachedTokenPrice.price;
  }

  try {
    const response = await fetch("https://www.storyscan.io/api/v2/stats");
    if (!response.ok) {
      throw new Error(`Failed to fetch token price: ${response.statusText}`);
    }

    const data = await response.json();
    const price = parseFloat(data.coin_price);

    // Cache the price
    cachedTokenPrice = { price, timestamp: now };

    console.log(`Current $IP price: $${price}`);
    return price;
  } catch (error) {
    console.error("Error fetching token price:", error);
    // Default fallback price if API fails
    return DEFAULT_IP_PRICE;
  }
}

/**
 * Converts a token amount from wei to $IP tokens
 * @param amountInWei Amount in wei (as string or number)
 * @returns Amount in $IP tokens
 */
export function weiToTokens(amountInWei: string | number): number {
  const amountInWeiNum =
    typeof amountInWei === "string" ? parseInt(amountInWei) : amountInWei;
  return amountInWeiNum / 1e18;
}

/**
 * Converts a token amount to USD value
 * @param tokenAmount Amount in $IP tokens
 * @param tokenPrice Current token price (optional - will be fetched if not provided)
 * @returns USD value of tokens
 */
export async function tokensToUSD(
  tokenAmount: number,
  tokenPrice?: number
): Promise<number> {
  const price = tokenPrice || (await getTokenPrice());
  return tokenAmount * price;
}

/**
 * Converts a wei amount directly to USD
 * @param weiAmount Amount in wei
 * @returns USD value
 */
export async function weiToUSD(weiAmount: string | number): Promise<number> {
  const tokenAmount = weiToTokens(weiAmount);
  return tokensToUSD(tokenAmount);
}

/**
 * Formats token amount for display
 * @param amount Amount in $IP tokens
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatTokenAmount(
  amount: number,
  decimals: number = 4
): string {
  return amount.toFixed(decimals);
}

/**
 * Formats USD amount for display
 * @param amount Amount in USD
 * @returns Formatted string with $ symbol
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
