declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
    setDebug(debug: boolean): void;
    getAccessToken(): string;
  }

  export class AdAccount {
    constructor(id: string);
    get(fields: string[]): Promise<{ _data: Record<string, unknown> }>;
    getCampaigns(fields: string[], params?: Record<string, unknown>): Promise<Campaign[] & { _paging?: Paging }>;
    getAdSets(fields: string[], params?: Record<string, unknown>): Promise<AdSet[] & { _paging?: Paging }>;
    getAds(fields: string[], params?: Record<string, unknown>): Promise<Ad[] & { _paging?: Paging }>;
    getInsights(fields: string[], params?: Record<string, unknown>): Promise<Array<{ _data: Record<string, unknown> }>>;
    getAdCreatives(fields: string[], params?: Record<string, unknown>): Promise<Array<{ _data: Record<string, unknown> }> & { _paging?: Paging }>;
    createCampaign(fields: string[], params: Record<string, unknown>): Promise<{ _data: { id: string } }>;
    createAdSet(fields: string[], params: Record<string, unknown>): Promise<{ _data: { id: string } }>;
    createAd(fields: string[], params: Record<string, unknown>): Promise<{ _data: { id: string } }>;
  }

  export class Campaign {
    _data: Record<string, unknown>;
    constructor(id: string);
    get(fields: string[]): Promise<{ _data: Record<string, unknown> }>;
    update(fields: string[], params: Record<string, unknown>): Promise<void>;
    getAdSets(fields: string[], params?: Record<string, unknown>): Promise<AdSet[] & { _paging?: Paging }>;
    getAds(fields: string[], params?: Record<string, unknown>): Promise<Ad[] & { _paging?: Paging }>;
  }

  export class AdSet {
    _data: Record<string, unknown>;
    constructor(id: string);
    get(fields: string[]): Promise<{ _data: Record<string, unknown> }>;
    update(fields: string[], params: Record<string, unknown>): Promise<void>;
    getAds(fields: string[], params?: Record<string, unknown>): Promise<Ad[] & { _paging?: Paging }>;
  }

  export class Ad {
    _data: Record<string, unknown>;
    constructor(id: string);
    get(fields: string[]): Promise<{ _data: Record<string, unknown> }>;
    update(fields: string[], params: Record<string, unknown>): Promise<void>;
  }

  interface Paging {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  }

  const bizSdk: {
    FacebookAdsApi: typeof FacebookAdsApi;
    AdAccount: typeof AdAccount;
    Campaign: typeof Campaign;
    AdSet: typeof AdSet;
    Ad: typeof Ad;
  };

  export default bizSdk;
}
