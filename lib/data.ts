import { IPAsset } from "@/types/ip";
import ipAssets from "@/data/ip-assets.json";

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
