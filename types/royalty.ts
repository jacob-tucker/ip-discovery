export interface RoyaltyPayment {
  id: string;
  ipId: string;
  fromAddress: string;
  amount: string; // Changed from number to string as formatTokenAmount returns string
  usdAmount: number;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}
