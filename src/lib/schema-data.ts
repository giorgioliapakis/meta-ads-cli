/**
 * Schema data for Meta Marketing API
 * Used by the `schema` command for field discovery
 */

export interface FieldInfo {
  name: string;
  type: 'string' | 'number' | 'currency' | 'percentage' | 'decimal' | 'array' | 'object';
  description: string;
}

export interface BreakdownInfo {
  name: string;
  category: 'demographics' | 'geography' | 'placement' | 'time' | 'product';
  description: string;
}

export interface ActionTypeInfo {
  name: string;
  category: 'conversion' | 'engagement' | 'app' | 'messaging';
  description: string;
}

// Common fields available at all levels
const COMMON_FIELDS: FieldInfo[] = [
  { name: 'impressions', type: 'number', description: 'Total impressions' },
  { name: 'clicks', type: 'number', description: 'Total clicks (all types)' },
  { name: 'spend', type: 'currency', description: 'Total spend in account currency' },
  { name: 'reach', type: 'number', description: 'Unique users reached' },
  { name: 'frequency', type: 'decimal', description: 'Average impressions per user' },
  { name: 'cpm', type: 'currency', description: 'Cost per 1000 impressions' },
  { name: 'cpc', type: 'currency', description: 'Cost per click' },
  { name: 'ctr', type: 'percentage', description: 'Click-through rate' },
  { name: 'cpp', type: 'currency', description: 'Cost per purchase' },
  { name: 'actions', type: 'array', description: 'Array of action types and values' },
  { name: 'cost_per_action_type', type: 'array', description: 'Array of costs per action type' },
  { name: 'date_start', type: 'string', description: 'Start date of the reporting period' },
  { name: 'date_stop', type: 'string', description: 'End date of the reporting period' },
];

// Video-specific fields
const VIDEO_FIELDS: FieldInfo[] = [
  { name: 'video_play_actions', type: 'array', description: '3-second video views' },
  { name: 'video_thruplay_watched_actions', type: 'array', description: 'ThruPlay views (15s or complete)' },
  { name: 'video_p25_watched_actions', type: 'array', description: '25% video watched' },
  { name: 'video_p50_watched_actions', type: 'array', description: '50% video watched' },
  { name: 'video_p75_watched_actions', type: 'array', description: '75% video watched' },
  { name: 'video_p100_watched_actions', type: 'array', description: '100% video watched' },
  { name: 'video_avg_time_watched_actions', type: 'array', description: 'Average time watched' },
];

// Level-specific identity fields
const LEVEL_FIELDS: Record<string, FieldInfo[]> = {
  account: [
    { name: 'account_id', type: 'string', description: 'Ad account ID' },
    { name: 'account_name', type: 'string', description: 'Ad account name' },
  ],
  campaign: [
    { name: 'campaign_id', type: 'string', description: 'Campaign ID' },
    { name: 'campaign_name', type: 'string', description: 'Campaign name' },
  ],
  adset: [
    { name: 'adset_id', type: 'string', description: 'Ad set ID' },
    { name: 'adset_name', type: 'string', description: 'Ad set name' },
    { name: 'campaign_id', type: 'string', description: 'Parent campaign ID' },
    { name: 'campaign_name', type: 'string', description: 'Parent campaign name' },
  ],
  ad: [
    { name: 'ad_id', type: 'string', description: 'Ad ID' },
    { name: 'ad_name', type: 'string', description: 'Ad name' },
    { name: 'adset_id', type: 'string', description: 'Parent ad set ID' },
    { name: 'adset_name', type: 'string', description: 'Parent ad set name' },
    { name: 'campaign_id', type: 'string', description: 'Parent campaign ID' },
    { name: 'campaign_name', type: 'string', description: 'Parent campaign name' },
  ],
};

export function getFieldsForLevel(level: string): FieldInfo[] {
  const levelFields = LEVEL_FIELDS[level] ?? [];
  return [...levelFields, ...COMMON_FIELDS];
}

export function getVideoFields(): FieldInfo[] {
  return VIDEO_FIELDS;
}

export const BREAKDOWNS: BreakdownInfo[] = [
  // Demographics
  { name: 'age', category: 'demographics', description: 'Age ranges (18-24, 25-34, 35-44, 45-54, 55-64, 65+)' },
  { name: 'gender', category: 'demographics', description: 'Gender (male, female, unknown)' },

  // Geography
  { name: 'country', category: 'geography', description: 'Country code (US, GB, CA, etc.)' },
  { name: 'region', category: 'geography', description: 'State/region within country' },
  { name: 'dma', category: 'geography', description: 'Designated Market Area (US only)' },

  // Placement
  { name: 'publisher_platform', category: 'placement', description: 'Platform: facebook, instagram, messenger, audience_network' },
  { name: 'platform_position', category: 'placement', description: 'Position: feed, story, reels, right_column, instant_article, etc.' },
  { name: 'device_platform', category: 'placement', description: 'Device: mobile, desktop' },
  { name: 'impression_device', category: 'placement', description: 'Specific device: iPhone, Android, Desktop, etc.' },

  // Time
  { name: 'hourly_stats_aggregated_by_advertiser_time_zone', category: 'time', description: 'Hourly breakdown (0-23)' },

  // Product (for catalog/shopping campaigns)
  { name: 'product_id', category: 'product', description: 'Product catalog item ID' },
];

export const ACTION_TYPES: ActionTypeInfo[] = [
  // Conversions (high-value)
  { name: 'purchase', category: 'conversion', description: 'Completed purchases' },
  { name: 'lead', category: 'conversion', description: 'Lead form submissions' },
  { name: 'complete_registration', category: 'conversion', description: 'Registration completions' },
  { name: 'subscribe', category: 'conversion', description: 'Subscription sign-ups' },
  { name: 'add_to_cart', category: 'conversion', description: 'Items added to cart' },
  { name: 'initiate_checkout', category: 'conversion', description: 'Checkout started' },
  { name: 'add_payment_info', category: 'conversion', description: 'Payment info added' },
  { name: 'search', category: 'conversion', description: 'Searches performed' },
  { name: 'view_content', category: 'conversion', description: 'Content/product views' },

  // Engagement
  { name: 'link_click', category: 'engagement', description: 'Link clicks' },
  { name: 'landing_page_view', category: 'engagement', description: 'Landing page views (link click + page load)' },
  { name: 'post_engagement', category: 'engagement', description: 'All post engagements (likes, comments, shares)' },
  { name: 'page_engagement', category: 'engagement', description: 'Page likes, follows, check-ins' },
  { name: 'video_view', category: 'engagement', description: 'Video views (3+ seconds)' },
  { name: 'post_reaction', category: 'engagement', description: 'Reactions on posts' },
  { name: 'comment', category: 'engagement', description: 'Comments on posts' },
  { name: 'post_save', category: 'engagement', description: 'Post saves' },
  { name: 'share', category: 'engagement', description: 'Shares' },

  // App
  { name: 'app_install', category: 'app', description: 'App installations' },
  { name: 'app_custom_event', category: 'app', description: 'Custom app events' },

  // Messaging
  { name: 'onsite_conversion.messaging_conversation_started_7d', category: 'messaging', description: 'Messaging conversations started' },
  { name: 'onsite_conversion.messaging_first_reply', category: 'messaging', description: 'First message replies' },
];

export const CAMPAIGN_OBJECTIVES = [
  { name: 'OUTCOME_AWARENESS', description: 'Reach and brand awareness campaigns' },
  { name: 'OUTCOME_ENGAGEMENT', description: 'Engagement, video views, page likes' },
  { name: 'OUTCOME_TRAFFIC', description: 'Website traffic campaigns' },
  { name: 'OUTCOME_LEADS', description: 'Lead generation campaigns' },
  { name: 'OUTCOME_APP_PROMOTION', description: 'App installs and engagement' },
  { name: 'OUTCOME_SALES', description: 'Conversions and catalog sales' },
];
