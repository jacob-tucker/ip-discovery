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
  title: string;
  description: string;
  createdAt: string;
  image: string;
  imageHash: string;
  mediaUrl: string;
  mediaHash: string;
  mediaType: string;
  creators: Creator[];
  tags: string[];
  ipType: string;
}
