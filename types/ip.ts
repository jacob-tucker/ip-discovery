export interface SocialMedia {
  platform: string;
  url: string;
}

export interface Creator {
  name: string;
  address: string;
  description: string;
  contributionPercent: number;
  socialMedia: SocialMedia[];
}

export interface IPAsset {
  ipId: string;
  title: string;
  description: string;
  createdAt: string;
  image: string;
  imageHash: string;
  mediaUrl: string;
  mediaHash: string;
  mediaType: string;
  creators: Creator[];
  ipType: string;
  metadataUri?: string;
}
