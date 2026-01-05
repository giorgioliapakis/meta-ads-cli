// API Response Types
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retry_after?: number;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface ResponseMeta {
  account_id?: string;
  timestamp: string;
  request_id?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  has_next: boolean;
  cursor?: string;
  total_count?: number;
}

// Config Types
export interface Config {
  access_token?: string;
  account_id?: string;
  output_format: 'json' | 'table';
  api_version: string;
  verbose: boolean;
}

export interface TokenInfo {
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number;
  expires_at: number;
  is_valid: boolean;
  scopes: string[];
  user_id?: string;
}

// Meta API Entity Types
export interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  amount_spent: string;
  balance: string;
  currency: string;
  spend_cap?: string;
  business_name?: string;
  business_city?: string;
  business_country_code?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  objective: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  special_ad_categories?: string[];
}

export interface AdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  end_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  billing_event: string;
  optimization_goal: string;
  bid_strategy?: string;
  bid_amount?: string;
  targeting?: Record<string, unknown>;
  // Delivery/learning phase info
  learning_phase_info?: {
    status: 'LEARNING' | 'SUCCESS' | 'FAIL';
  };
  issues_info?: Array<{
    level: string;
    error_code: number;
    error_summary: string;
    error_message?: string;
  }>;
}

export interface Ad {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  created_time: string;
  updated_time: string;
  creative?: AdCreative;
  preview_shareable_link?: string;
  // Delivery info
  issues_info?: Array<{
    level: string;
    error_code: number;
    error_summary: string;
    error_message?: string;
  }>;
}

export interface AdCreative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  image_hash?: string;
  image_url?: string;
  video_id?: string;
  thumbnail_url?: string;
  object_story_spec?: {
    page_id?: string;
    link_data?: {
      link?: string;
      message?: string;
      name?: string;        // headline
      description?: string; // description/body
      image_hash?: string;
      video_id?: string;
      call_to_action?: { type: string };
    };
    video_data?: {
      video_id?: string;
      title?: string;
      message?: string;
      image_hash?: string;
      call_to_action?: { type: string };
    };
  };
  call_to_action_type?: string;
  effective_object_story_id?: string;
}

// Normalized creative data for agent consumption
export interface ProcessedCreative {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'unknown';
  headline?: string;
  body?: string;
  description?: string;
  cta_type?: string;
  image_url?: string;
  video_id?: string;
  thumbnail_url?: string;
  link?: string;
}

export interface AdImage {
  hash: string;
  name?: string;
  url?: string;
  width?: number;
  height?: number;
  created_time?: string;
  bytes?: number;
}

export interface AdVideo {
  id: string;
  title?: string;
  source?: string;
  picture?: string;
  created_time?: string;
  updated_time?: string;
  length?: number;
  status?: {
    video_status?: string;
    processing_progress?: number;
  };
}

export interface Insights {
  account_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  date_start?: string;
  date_stop?: string;
  impressions: string;
  clicks?: string;
  spend: string;
  reach?: string;
  frequency?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  cpp?: string;
  actions?: InsightAction[];
  cost_per_action_type?: InsightAction[];
  // Video metrics
  video_play_actions?: InsightAction[];
  video_thruplay_watched_actions?: InsightAction[];
  video_p25_watched_actions?: InsightAction[];
  video_p50_watched_actions?: InsightAction[];
  video_p75_watched_actions?: InsightAction[];
  video_p100_watched_actions?: InsightAction[];
}

export interface InsightAction {
  action_type: string;
  value: string;
}

// Pagination Response from Meta API
export interface MetaPaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

// Global Flags
export interface GlobalFlags {
  account?: string;
  output?: 'json' | 'table';
  verbose?: boolean;
  quiet?: boolean;
}
