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
  AdImage,
  AdVideo,
  Insights,
  MetaPaginatedResponse,
  RateLimitInfo,
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
  all?: boolean; // Auto-paginate to fetch all results
}

const GRAPH_URL = 'https://graph.facebook.com';

export class MetaAdsClient {
  private accessToken: string;
  private accountId?: string;
  private apiVersion: string;
  private debug: boolean;
  private lastRateLimitInfo?: RateLimitInfo;

  constructor(options: ClientOptions) {
    this.accessToken = options.accessToken;
    this.accountId = options.accountId;
    this.apiVersion = options.apiVersion ?? 'v22.0';
    this.debug = options.debug ?? false;
  }

  /**
   * Get rate limit info from the last API call
   * Useful for agents to throttle proactively
   */
  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.lastRateLimitInfo;
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

      // Parse rate limit headers (Meta returns usage as JSON in x-business-use-case-usage)
      this.parseRateLimitHeaders(response);

      const result = await response.json() as T & { error?: { message: string; code: number } };

      if (result.error) {
        throw { response: { error: result.error } };
      }

      return result;
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }

  /**
   * Parse rate limit headers from Meta API response
   * Header format: {"account_id": [{"call_count": 28, "total_cputime": 50, "total_time": 25, ...}]}
   */
  private parseRateLimitHeaders(response: Response): void {
    const rateLimitHeader = response.headers.get('x-business-use-case-usage');
    if (!rateLimitHeader) return;

    try {
      const usageData = JSON.parse(rateLimitHeader) as Record<string, Array<{
        call_count?: number;
        total_cputime?: number;
        total_time?: number;
      }>>;

      // Get the first account's usage data
      const accountUsage = Object.values(usageData)[0];
      if (accountUsage?.[0]) {
        const usage = accountUsage[0];
        this.lastRateLimitInfo = {
          call_count: usage.call_count,
          total_cputime: usage.total_cputime,
          total_time: usage.total_time,
          usage_pct: Math.max(
            usage.call_count ?? 0,
            usage.total_cputime ?? 0,
            usage.total_time ?? 0
          ),
        };
      }
    } catch {
      // Ignore parse errors - rate limit info is optional
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

      // Parse rate limit headers
      this.parseRateLimitHeaders(response);

      const result = await response.json() as T & { error?: { message: string; code: number } };

      if (result.error) {
        throw { response: { error: result.error } };
      }

      return result;
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }

  // ============ Auto-pagination Helper ============

  private async autoPaginate<T>(
    fetcher: (cursor?: string) => Promise<MetaPaginatedResponse<T>>,
    maxPages: number = 100,
  ): Promise<T[]> {
    const allData: T[] = [];
    let cursor: string | undefined;
    let page = 0;

    do {
      const result = await fetcher(cursor);
      allData.push(...result.data);
      cursor = result.paging?.cursors?.after;
      page++;
    } while (cursor && page < maxPages);

    return allData;
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

    const fetchPage = async (cursor?: string): Promise<MetaPaginatedResponse<Campaign>> => {
      const params: Record<string, string> = {
        fields: fields.join(','),
        limit: String(options?.limit ?? 25),
      };
      if (cursor) params.after = cursor;
      else if (options?.after) params.after = options.after;
      if (options?.status) params.filtering = JSON.stringify([{ field: 'status', operator: 'IN', value: [options.status] }]);
      return this.request<MetaPaginatedResponse<Campaign>>(`${accountId}/campaigns`, params);
    };

    if (options?.all) {
      const allData = await this.autoPaginate(fetchPage);
      return { data: allData };
    }

    return fetchPage();
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

  async listAdSets(options?: ListOptions & { campaignId?: string; status?: string; includeDelivery?: boolean }): Promise<MetaPaginatedResponse<AdSet>> {
    const baseFields = [
      'id', 'name', 'campaign_id', 'status', 'effective_status', 'created_time', 'updated_time',
      'daily_budget', 'lifetime_budget', 'budget_remaining', 'billing_event', 'optimization_goal',
    ];
    const deliveryFields = options?.includeDelivery ? ['learning_phase_info', 'issues_info'] : [];
    const fields = options?.fields ?? [...baseFields, ...deliveryFields];
    const endpoint = options?.campaignId ? `${options.campaignId}/adsets` : `${this.getAccountId()}/adsets`;

    const fetchPage = async (cursor?: string): Promise<MetaPaginatedResponse<AdSet>> => {
      const params: Record<string, string> = {
        fields: fields.join(','),
        limit: String(options?.limit ?? 25),
      };
      if (cursor) params.after = cursor;
      else if (options?.after) params.after = options.after;
      if (options?.status) params.filtering = JSON.stringify([{ field: 'status', operator: 'IN', value: [options.status] }]);
      return this.request<MetaPaginatedResponse<AdSet>>(endpoint, params);
    };

    if (options?.all) {
      const allData = await this.autoPaginate(fetchPage);
      return { data: allData };
    }

    return fetchPage();
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

  async listAds(options?: ListOptions & { adsetId?: string; campaignId?: string; status?: string; includeDelivery?: boolean; includeCreative?: boolean }): Promise<MetaPaginatedResponse<Ad>> {
    const baseFields = [
      'id', 'name', 'adset_id', 'campaign_id', 'status', 'effective_status',
      'created_time', 'updated_time', 'preview_shareable_link',
    ];
    const deliveryFields = options?.includeDelivery ? ['issues_info'] : [];
    // Request creative with nested fields for full creative data
    const creativeFields = options?.includeCreative
      ? ['creative{id,name,title,body,image_url,video_id,thumbnail_url,call_to_action_type,object_story_spec}']
      : [];
    const fields = options?.fields ?? [...baseFields, ...deliveryFields, ...creativeFields];

    let endpoint: string;
    if (options?.adsetId) {
      endpoint = `${options.adsetId}/ads`;
    } else if (options?.campaignId) {
      endpoint = `${options.campaignId}/ads`;
    } else {
      endpoint = `${this.getAccountId()}/ads`;
    }

    const fetchPage = async (cursor?: string): Promise<MetaPaginatedResponse<Ad>> => {
      const params: Record<string, string> = {
        fields: fields.join(','),
        limit: String(options?.limit ?? 25),
      };
      if (cursor) params.after = cursor;
      else if (options?.after) params.after = options.after;
      // Note: Ads API requires 'effective_status' not 'status' for filtering
      if (options?.status) params.filtering = JSON.stringify([{ field: 'effective_status', operator: 'IN', value: [options.status] }]);
      return this.request<MetaPaginatedResponse<Ad>>(endpoint, params);
    };

    if (options?.all) {
      const allData = await this.autoPaginate(fetchPage);
      return { data: allData };
    }

    return fetchPage();
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
    dateRange?: { start: string; end: string } | { since: string; until: string };
    fields?: string[];
    extraFields?: string[];
    breakdowns?: string[];
    limit?: number;
    includeVideoMetrics?: boolean;
  }): Promise<Insights[]> {
    const accountId = this.getAccountId();
    const baseFields = [
      'impressions', 'clicks', 'spend', 'reach', 'frequency', 'cpm', 'cpc', 'ctr',
      'actions', 'cost_per_action_type',
    ];
    // Add entity ID/name fields based on level
    const levelFields: Record<string, string[]> = {
      campaign: ['campaign_id', 'campaign_name'],
      adset: ['campaign_id', 'campaign_name', 'adset_id', 'adset_name'],
      ad: ['campaign_id', 'campaign_name', 'adset_id', 'adset_name', 'ad_id', 'ad_name'],
    };

    // Build fields list
    let fieldsToRequest: string[];
    if (options.fields) {
      // Custom fields specified - use directly
      fieldsToRequest = options.fields;
    } else {
      // Use defaults
      fieldsToRequest = [...(levelFields[options.level] ?? []), ...baseFields];
    }

    // Add video fields if requested
    if (options.includeVideoMetrics) {
      fieldsToRequest.push('video_play_actions', 'video_thruplay_watched_actions');
    }

    // Add extra fields if specified
    if (options.extraFields) {
      fieldsToRequest.push(...options.extraFields);
    }

    const params: Record<string, string> = {
      level: options.level,
      fields: fieldsToRequest.join(','),
    };
    if (options.datePreset) params.date_preset = options.datePreset;
    if (options.dateRange) {
      // Support both { start, end } and { since, until } formats
      const range = 'since' in options.dateRange
        ? options.dateRange
        : { since: options.dateRange.start, until: options.dateRange.end };
      params.time_range = JSON.stringify(range);
    }
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

  // ============ Image Upload ============

  async uploadImage(filePath: string, name?: string): Promise<AdImage> {
    const accountId = this.getAccountId();
    const url = `${GRAPH_URL}/${this.apiVersion}/${accountId}/adimages`;

    const { readFile } = await import('node:fs/promises');
    const { basename } = await import('node:path');

    const fileBuffer = await readFile(filePath);
    const fileName = name ?? basename(filePath);

    const formData = new FormData();
    formData.append('access_token', this.accessToken);
    formData.append('filename', new Blob([fileBuffer]), fileName);

    if (this.debug) {
      console.error(`[debug] POST ${url} (uploading ${fileName})`);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json() as { images?: Record<string, AdImage>; error?: { message: string } };

      if (result.error) {
        throw { response: { error: result.error } };
      }

      // Response format: { images: { "filename": { hash, url, ... } } }
      const images = result.images;
      if (!images) {
        throw new Error('No image data in response');
      }
      const imageData = Object.values(images)[0];
      return imageData;
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }

  async listImages(options?: ListOptions): Promise<MetaPaginatedResponse<AdImage>> {
    const accountId = this.getAccountId();
    const fields = options?.fields ?? ['hash', 'name', 'url', 'width', 'height', 'created_time'];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;

    return this.request<MetaPaginatedResponse<AdImage>>(`${accountId}/adimages`, params);
  }

  // ============ Video Upload ============

  async uploadVideo(params: { filePath?: string; fileUrl?: string; name: string }): Promise<AdVideo> {
    const accountId = this.getAccountId();
    const url = `${GRAPH_URL}/${this.apiVersion}/${accountId}/advideos`;

    if (this.debug) {
      console.error(`[debug] POST ${url} (uploading video: ${params.name})`);
    }

    try {
      if (params.fileUrl) {
        // Upload from URL
        const body = new URLSearchParams();
        body.set('access_token', this.accessToken);
        body.set('file_url', params.fileUrl);
        body.set('name', params.name);

        const response = await fetch(url, { method: 'POST', body });
        const result = await response.json() as AdVideo & { error?: { message: string } };

        if (result.error) {
          throw { response: { error: result.error } };
        }
        return result;
      } else if (params.filePath) {
        // Upload from file
        const { readFile } = await import('node:fs/promises');
        const fileBuffer = await readFile(params.filePath);

        const formData = new FormData();
        formData.append('access_token', this.accessToken);
        formData.append('name', params.name);
        formData.append('source', new Blob([fileBuffer]), params.name);

        const response = await fetch(url, { method: 'POST', body: formData });
        const result = await response.json() as AdVideo & { error?: { message: string } };

        if (result.error) {
          throw { response: { error: result.error } };
        }
        return result;
      } else {
        throw new Error('Either filePath or fileUrl is required');
      }
    } catch (error) {
      throw handleMetaApiError(error);
    }
  }

  async listVideos(options?: ListOptions): Promise<MetaPaginatedResponse<AdVideo>> {
    const accountId = this.getAccountId();
    const fields = options?.fields ?? ['id', 'title', 'source', 'picture', 'created_time', 'updated_time', 'length'];
    const params: Record<string, string> = {
      fields: fields.join(','),
      limit: String(options?.limit ?? 25),
    };
    if (options?.after) params.after = options.after;

    return this.request<MetaPaginatedResponse<AdVideo>>(`${accountId}/advideos`, params);
  }

  async getVideo(videoId: string, fields?: string[]): Promise<AdVideo> {
    const defaultFields = ['id', 'title', 'source', 'picture', 'created_time', 'updated_time', 'length', 'status'];
    return this.request<AdVideo>(videoId, { fields: (fields ?? defaultFields).join(',') });
  }

  // ============ Ad Creative Creation ============

  async createCreative(params: {
    name: string;
    object_story_spec?: {
      page_id: string;
      link_data?: {
        link: string;
        message?: string;
        image_hash?: string;
        video_id?: string;
        call_to_action?: { type: string; value?: { link?: string } };
      };
      video_data?: {
        video_id: string;
        image_hash?: string;
        title?: string;
        message?: string;
        call_to_action?: { type: string; value?: { link?: string } };
      };
    };
    asset_feed_spec?: Record<string, unknown>;
    degrees_of_freedom_spec?: Record<string, unknown>;
  }): Promise<AdCreative> {
    const accountId = this.getAccountId();
    const result = await this.post<{ id: string }>(`${accountId}/adcreatives`, params);
    return this.getCreative(result.id);
  }
}
