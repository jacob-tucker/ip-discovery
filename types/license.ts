export interface LicenseTemplateInfo {
  blockNumber: string;
  blockTime: string;
  id: string;
  metadataUri: string;
  name: string;
}

export interface LicenseTerms {
  commercialAttribution: boolean;
  commercialRevCeiling: number;
  commercialRevShare: number;
  commercialUse: boolean;
  commercializerChecker: string;
  commercializerCheckerData: string;
  currency: string;
  defaultMintingFee: number;
  derivativeRevCeiling: number;
  derivativesAllowed: boolean;
  derivativesApproval: boolean;
  derivativesAttribution: boolean;
  derivativesReciprocal: boolean;
  expiration: number;
  royaltyPolicy: string;
  transferable: boolean;
  uri: string;
}

// Additional fields from license URI (off-chain terms)
export interface OffchainTerms {
  territory: string[];
  channelsOfDistribution: string[];
  attribution: boolean;
  contentStandards: string[];
  sublicensable: boolean;
  aiLearningModels: boolean;
  restrictionOnCrossPlatformUse: boolean;
  governingLaw: string;
  additionalParameters: Record<string, any>;
  PILUri: string;
}

export interface LicensingConfig {
  isSet: boolean;
  mintingFee: string;
  licensingHook: string;
  hookData: string;
  commercialRevShare: number;
  disabled: boolean;
  expectMinimumGroupRewardShare: number;
  expectGroupRewardPool: string;
}

export interface DetailedLicenseTerms {
  disabled: boolean;
  id: string;
  ipId: string;
  licenseTemplate: LicenseTemplateInfo;
  licenseTemplateId: string;
  terms: LicenseTerms;
  licensingConfig?: LicensingConfig;

  // Additional fields we add for the UI
  usdPrice?: number;
  displayName?: string;
  description?: string;
  hasOverrides?: boolean;

  // Store original values when overridden
  originalTerms?: {
    defaultMintingFee?: number;
    commercialRevShare?: number;
  };

  // Store effective (potentially overridden) values
  effectiveTerms: {
    defaultMintingFee: number;
    commercialRevShare: number;
  };

  // Off-chain terms from URI (fetched at the API layer)
  offchainTerms?: OffchainTerms;
}

export interface DetailedLicenseTermsResponse {
  data: DetailedLicenseTerms[];
}
