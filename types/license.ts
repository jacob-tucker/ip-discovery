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

export interface DetailedLicenseTerms {
  disabled: boolean;
  id: string;
  ipId: string;
  licenseTemplate: LicenseTemplateInfo;
  licenseTemplateId: string;
  terms: LicenseTerms;

  // Additional fields we add for the UI
  usdPrice?: number;
  displayName?: string;
  description?: string;
}

export interface DetailedLicenseTermsResponse {
  data: DetailedLicenseTerms[];
}
