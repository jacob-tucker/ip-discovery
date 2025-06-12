export interface RoyaltyPayment {
  id: string;
  ipId: string;
  fromAddress: string;
  amount: number;
  usdAmount: number;
  timestamp: number;
  blockNumber: number;
}
