import { IPAsset } from "@/types/ip";
import { RoyaltyPayment } from "@/types/royalty";
import ipAssets from "@/data/ip-assets.json";
import royaltyPayments from "@/data/royalty-payments.json";

export const getIPAssets = async (): Promise<IPAsset[]> => {
  return ipAssets as IPAsset[];
};

export const getIPAssetByTitle = async (
  title: string
): Promise<IPAsset | null> => {
  const assets = await getIPAssets();
  return (
    assets.find((asset) => asset.title.toLowerCase() === title.toLowerCase()) ||
    null
  );
};

export const getAllRoyaltyPayments = async (): Promise<RoyaltyPayment[]> => {
  // Sort by timestamp in descending order (most recent first)
  return (royaltyPayments as RoyaltyPayment[]).sort(
    (a, b) => b.timestamp - a.timestamp
  );
};

export const getRoyaltyPaymentsForIP = async (
  ipTitle: string,
  limit?: number
): Promise<RoyaltyPayment[]> => {
  const allPayments = await getAllRoyaltyPayments();
  const ipPayments = allPayments.filter((payment) => payment.ipId === ipTitle);

  return limit ? ipPayments.slice(0, limit) : ipPayments;
};
