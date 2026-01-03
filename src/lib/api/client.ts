import { configManager, type FlagValues } from '../config/manager.js';
import { tokenManager } from '../auth/token-manager.js';
import { handleMetaApiError, CliError } from '../errors/handler.js';
import { ErrorCode } from '../errors/codes.js';
import type {
  AdAccount,
  Campaign,
  AdSet,
  Ad,
  AdCreative,
  Insights,
  MetaPaginatedResponse,
} from '../../types/index.js';

export interface ClientOptions {
  accessToken: string;
  accountId?: string;
  apiVersion?: string;
  debug?: boolean;
}

export interface ListOptions {
  limit?: number;
  after?: string;
  fields?: string[];
}

const GRAPH_URL = 'https://graph.facebook.com';

export class MetaAdsClient {
  private accessToken: string;
  private accountId?: string;
  private apiVersion: string;
  private debug: boolean;

  constructor(options: ClientOptions) {
    this.accessToken = options.accessToken;
    this.accountId = options.accountId;
    this.apiVersion = options.apiVersion ?? 'v22.0';
    this.debug = options.debug ?? false;
  }

  static async fromConfig(flags?: FlagValues): Promise<MetaAdsClient> {
    const token = await tokenManager.getToken(flags);
    const accountId = configManager.getAccountId(flags);

    return new MetaAdsClient({
      accessToken: token,
      accountId,
      apiVersion: configManager.getApiVersion(),
      debug: configManager.getVerbose(flags),
    });
  }

  getAccountId(): string {
    if (!this.accountId) {
      throw new CliError(
        ErrorCode.INVALID_ACCOUNT_ID,
        'No ad account ID configured. Use --account flag or run `meta-ads config set account_id <id>`'
      );
    }
    return this.accountId;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${GRAPH_URL}/${this.apiVersion}/${endpoint}`);
    url.searchParams.set('access_token', this.accessToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    if (this.debug) {
      console.error(`[debug] GET ${url.pathname}${url.search}`);
    }

    try {
      const response = await fetch(url.toString());
      const result = await response.json() as T & { error?: { message: string; code: number } };

      if (result.error) {
        throw { response: { error: result.error } };
      }

      return result;
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }

  private async post<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    const url = new URL(`${GRAPH_URL}/${this.apiVersion}/${endpoint}`);

    if (this.debug) {
      console.error(`[debug] POST ${url.pathname}`);
    }

    try {
      const body = new URLSearchParams();
      body.set('access_token', this.accessToken);
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        body,
      });
      const result = await response.json() as T & { error?: { message: string; code: number } };

      if (result.error) {
        throw { response: { error: result.error } };
      }

      return result;
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }

  // ============ Account Operations ============

  async listAccounts(options?: ListOptions): Promise<MetaPaginatedResponse<AdAccount>> {
    const fields = options?.fields ?? [
      'id', 'account_id', 'name', 'account_status', 'amount_spent', 'balance', 'currency', 'spend_cap', 'business_name',
    ];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;

    return this.request<MetaPaginatedResponse<AdAccount>>('me/adaccounts', params);
  }

  async getAccount(accountId: string): Promise<AdAccount> {
    const fields = [
      'id', 'account_id', 'name', 'account_status', 'amount_spent', 'balance', 'currency',
      'spend_cap', 'business_name', 'business_city', 'business_country_code',
    ];
    return this.request<AdAccount>(accountId, { fields: fields.join(',') });
  }

  // ============ Campaign Operations ============

  async listCampaigns(options?: ListOptions & { status?: string }): Promise<MetaPaginatedResponse<Campaign>> {
    const accountId = this.getAccountId();
    const fields = options?.fields ?? [
      'id', 'name', 'status', 'effective_status', 'objective', 'created_time', 'updated_time',
      'daily_budget', 'lifetime_budget', 'budget_remaining',
    ];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;
    if (options?.status) params.filtering = JSON.stringify([{ field: 'status', operator: 'IN', value: [options.status] }]);

    return this.request<MetaPaginatedResponse<Campaign>>(`${accountId}/campaigns`, params);
  }

  async getCampaign(campaignId: string, fields?: string[]): Promise<Campaign> {
    const defaultFields = [
      'id', 'name', 'status', 'effective_status', 'objective', 'created_time', 'updated_time',
      'start_time', 'stop_time', 'daily_budget', 'lifetime_budget', 'budget_remaining', 'special_ad_categories',
    ];
    return this.request<Campaign>(campaignId, { fields: (fields ?? defaultFields).join(',') });
  }

  async createCampaign(params: {
    name: string;
    objective: string;
    status?: string;
    special_ad_categories?: string[];
    daily_budget?: string;
    lifetime_budget?: string;
  }): Promise<Campaign> {
    const accountId = this.getAccountId();
    const result = await this.post<{ id: string }>(`${accountId}/campaigns`, {
      name: params.name,
      objective: params.objective,
      status: params.status ?? 'PAUSED',
      special_ad_categories: params.special_ad_categories ?? [],
      daily_budget: params.daily_budget,
      lifetime_budget: params.lifetime_budget,
    });
    return this.getCampaign(result.id);
  }

  async updateCampaign(campaignId: string, params: Partial<Campaign>): Promise<Campaign> {
    await this.post<{ success: boolean }>(campaignId, params as Record<string, unknown>);
    return this.getCampaign(campaignId);
  }

  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<Campaign> {
    return this.updateCampaign(campaignId, { status });
  }

  // ============ Ad Set Operations ============

  async listAdSets(options?: ListOptions & { campaignId?: string; status?: string }): Promise<MetaPaginatedResponse<AdSet>> {
    const fields = options?.fields ?? [
      'id', 'name', 'campaign_id', 'status', 'effective_status', 'created_time', 'updated_time',
      'daily_budget', 'lifetime_budget', 'budget_remaining', 'billing_event', 'optimization_goal',
    ];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;
    if (options?.status) params.filtering = JSON.stringify([{ field: 'status', operator: 'IN', value: [options.status] }]);

    const endpoint = options?.campaignId ? `${options.campaignId}/adsets` : `${this.getAccountId()}/adsets`;
    return this.request<MetaPaginatedResponse<AdSet>>(endpoint, params);
  }

  async getAdSet(adsetId: string, fields?: string[]): Promise<AdSet> {
    const defaultFields = [
      'id', 'name', 'campaign_id', 'status', 'effective_status', 'created_time', 'updated_time',
      'start_time', 'end_time', 'daily_budget', 'lifetime_budget', 'budget_remaining',
      'billing_event', 'optimization_goal', 'bid_strategy', 'bid_amount', 'targeting',
    ];
    return this.request<AdSet>(adsetId, { fields: (fields ?? defaultFields).join(',') });
  }

  async createAdSet(params: {
    name: string;
    campaign_id: string;
    billing_event: string;
    optimization_goal: string;
    targeting: Record<string, unknown>;
    status?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    start_time?: string;
    end_time?: string;
    bid_amount?: string;
  }): Promise<AdSet> {
    const accountId = this.getAccountId();
    const result = await this.post<{ id: string }>(`${accountId}/adsets`, {
      ...params,
      status: params.status ?? 'PAUSED',
    });
    return this.getAdSet(result.id);
  }

  async updateAdSet(adsetId: string, params: Partial<AdSet>): Promise<AdSet> {
    await this.post<{ success: boolean }>(adsetId, params as Record<string, unknown>);
    return this.getAdSet(adsetId);
  }

  async updateAdSetStatus(adsetId: string, status: 'ACTIVE' | 'PAUSED'): Promise<AdSet> {
    return this.updateAdSet(adsetId, { status });
  }

  // ============ Ad Operations ============

  async listAds(options?: ListOptions & { adsetId?: string; campaignId?: string; status?: string }): Promise<MetaPaginatedResponse<Ad>> {
    const fields = options?.fields ?? [
      'id', 'name', 'adset_id', 'campaign_id', 'status', 'effective_status',
      'created_time', 'updated_time', 'preview_shareable_link',
    ];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;
    if (options?.status) params.filtering = JSON.stringify([{ field: 'status', operator: 'IN', value: [options.status] }]);

    let endpoint: string;
    if (options?.adsetId) {
      endpoint = `${options.adsetId}/ads`;
    } else if (options?.campaignId) {
      endpoint = `${options.campaignId}/ads`;
    } else {
      endpoint = `${this.getAccountId()}/ads`;
    }
    return this.request<MetaPaginatedResponse<Ad>>(endpoint, params);
  }

  async getAd(adId: string, fields?: string[]): Promise<Ad> {
    const defaultFields = [
      'id', 'name', 'adset_id', 'campaign_id', 'status', 'effective_status',
      'created_time', 'updated_time', 'creative', 'preview_shareable_link',
    ];
    return this.request<Ad>(adId, { fields: (fields ?? defaultFields).join(',') });
  }

  async createAd(params: {
    name: string;
    adset_id: string;
    creative: { creative_id: string } | Record<string, unknown>;
    status?: string;
  }): Promise<Ad> {
    const accountId = this.getAccountId();
    const result = await this.post<{ id: string }>(`${accountId}/ads`, {
      ...params,
      status: params.status ?? 'PAUSED',
    });
    return this.getAd(result.id);
  }

  async updateAd(adId: string, params: Partial<Ad>): Promise<Ad> {
    await this.post<{ success: boolean }>(adId, params as Record<string, unknown>);
    return this.getAd(adId);
  }

  async updateAdStatus(adId: string, status: 'ACTIVE' | 'PAUSED'): Promise<Ad> {
    return this.updateAd(adId, { status });
  }

  // ============ Insights Operations ============

  async getInsights(options: {
    level: 'account' | 'campaign' | 'adset' | 'ad';
    datePreset?: string;
    dateRange?: { start: string; end: string };
    fields?: string[];
    breakdowns?: string[];
    limit?: number;
  }): Promise<Insights[]> {
    const accountId = this.getAccountId();
    const defaultFields = [
      'impressions', 'clicks', 'spend', 'reach', 'frequency', 'cpm', 'cpc', 'ctr',
      'actions', 'cost_per_action_type',
    ];
    const params: Record<string, string> = {
      level: options.level,
      fields: (options.fields ?? defaultFields).join(','),
    };
    if (options.datePreset) params.date_preset = options.datePreset;
    if (options.dateRange) params.time_range = JSON.stringify({ since: options.dateRange.start, until: options.dateRange.end });
    if (options.breakdowns) params.breakdowns = options.breakdowns.join(',');
    if (options.limit) params.limit = String(options.limit);

    const result = await this.request<{ data: Insights[] }>(`${accountId}/insights`, params);
    return result.data;
  }

  // ============ Creative Operations ============

  async listCreatives(options?: ListOptions): Promise<MetaPaginatedResponse<AdCreative>> {
    const accountId = this.getAccountId();
    const fields = options?.fields ?? [
      'id', 'name', 'title', 'body', 'image_hash', 'image_url', 'video_id', 'thumbnail_url', 'call_to_action_type',
    ];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;

    return this.request<MetaPaginatedResponse<AdCreative>>(`${accountId}/adcreatives`, params);
  }

  async getCreative(creativeId: string, fields?: string[]): Promise<AdCreative> {
    const defaultFields = [
      'id', 'name', 'title', 'body', 'image_hash', 'image_url', 'video_id',
      'thumbnail_url', 'object_story_spec', 'call_to_action_type',
    ];
    return this.request<AdCreative>(creativeId, { fields: (fields ?? defaultFields).join(',') });
  }
}
