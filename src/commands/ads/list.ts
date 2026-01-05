import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Ad, Insights, AdCreative, ProcessedCreative } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';
import { CONVERSION_ACTIONS, DATE_PRESETS } from '../../lib/constants.js';

// Combined ad + insights for agent-friendly output
interface AdWithInsights {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  // Insights metrics
  spend: number;
  impressions: number;
  results: number;
  result_type: string;
  cost_per_result: number | null;
  ctr: number;
  // Creative context (optional)
  creative?: ProcessedCreative;
}

/**
 * Process raw creative data into normalized format for agent consumption
 */
function processCreative(raw: AdCreative | undefined): ProcessedCreative | undefined {
  if (!raw) return undefined;

  // Determine creative type
  let type: ProcessedCreative['type'] = 'unknown';
  if (raw.video_id) {
    type = 'video';
  } else if (raw.image_url || raw.image_hash) {
    type = 'image';
  }
  // Note: Carousel detection would need asset_feed_spec which requires additional fields

  // Extract text content from various possible locations
  const oss = raw.object_story_spec;
  const linkData = oss?.link_data;
  const videoData = oss?.video_data;

  // Get headline (can be in title, link_data.name, or video_data.title)
  const headline = raw.title || linkData?.name || videoData?.title;

  // Get body text (can be in body, link_data.message, or video_data.message)
  const body = raw.body || linkData?.message || videoData?.message;

  // Get description (link_data.description)
  const description = linkData?.description;

  // Get CTA type
  const ctaType = raw.call_to_action_type ||
    linkData?.call_to_action?.type ||
    videoData?.call_to_action?.type;

  // Get video ID (can be in multiple places)
  const videoId = raw.video_id || linkData?.video_id || videoData?.video_id;

  return {
    id: raw.id,
    type,
    ...(headline && { headline }),
    ...(body && { body }),
    ...(description && { description }),
    ...(ctaType && { cta_type: ctaType }),
    ...(raw.image_url && { image_url: raw.image_url }),
    ...(videoId && { video_id: videoId }),
    ...(raw.thumbnail_url && { thumbnail_url: raw.thumbnail_url }),
    ...(linkData?.link && { link: linkData.link }),
  };
}

function mergeAdWithInsights(ad: Ad, insightsMap: Map<string, Insights>): AdWithInsights {
  const insight = insightsMap.get(ad.id);

  let results = 0;
  let resultType = 'none';
  let costPerResult: number | null = null;

  if (insight) {
    const actions = insight.actions ?? [];
    const costs = insight.cost_per_action_type ?? [];

    // Find primary conversion
    for (const actionType of CONVERSION_ACTIONS) {
      const action = actions.find((a) =>
        a.action_type === actionType ||
        a.action_type === `offsite_conversion.fb_pixel_${actionType}` ||
        a.action_type === `onsite_web_${actionType}`
      );
      if (action) {
        resultType = actionType;
        results = Number(action.value);
        const cost = costs.find((c) =>
          c.action_type === actionType ||
          c.action_type === `offsite_conversion.fb_pixel_${actionType}` ||
          c.action_type === `onsite_web_${actionType}`
        );
        costPerResult = cost ? Number(cost.value) : null;
        break;
      }
    }
  }

  return {
    id: ad.id,
    name: ad.name,
    status: ad.status,
    effective_status: ad.effective_status,
    spend: insight ? Number(insight.spend ?? 0) : 0,
    impressions: insight ? Number(insight.impressions ?? 0) : 0,
    results,
    result_type: resultType,
    cost_per_result: costPerResult,
    ctr: insight ? Number(insight.ctr ?? 0) : 0,
  };
}

export default class List extends AuthenticatedCommand {
  static override description = 'List ads';

  static override examples = [
    '<%= config.bin %> ads list',
    '<%= config.bin %> ads list --adset 120310123456789',
    '<%= config.bin %> ads list --campaign 120210123456789',
    '<%= config.bin %> ads list --status ACTIVE',
    // Agent-optimized examples
    '<%= config.bin %> ads list --with-insights --date-preset last_7d',
    '<%= config.bin %> ads list --with-insights --date-preset last_7d --sort-by cost_per_result',
    '<%= config.bin %> ads list --all',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    campaign: Flags.string({ char: 'c', description: 'Filter by campaign ID' }),
    adset: Flags.string({ description: 'Filter by ad set ID' }),
    status: Flags.string({ char: 's', description: 'Filter by status', options: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] }),
    limit: Flags.integer({ char: 'l', description: 'Maximum number of ads', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
    // Agent-optimized flags
    'with-insights': Flags.boolean({ description: 'Include performance metrics (requires --date-preset)', default: false }),
    'date-preset': Flags.string({ description: 'Date preset for insights', options: [...DATE_PRESETS] }),
    'sort-by': Flags.string({ description: 'Sort by metric (spend, results, cost_per_result, impressions)' }),
    'min-spend': Flags.integer({ description: 'Filter: minimum spend amount' }),
    'min-results': Flags.integer({ description: 'Filter: minimum results/conversions' }),
    all: Flags.boolean({ description: 'Fetch all pages automatically (ignores limit)', default: false }),
    'include-creative': Flags.boolean({ description: 'Include creative details (headline, body, image/video URLs)', default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listAds({
        campaignId: flags.campaign,
        adsetId: flags.adset,
        status: flags.status,
        limit: flags.all ? 100 : flags.limit,
        after: flags.after,
        all: flags.all,
        includeCreative: flags['include-creative'],
      });

      if (flags['with-insights']) {
        // Fetch insights for these ads
        const insights = await this.client.getInsights({
          level: 'ad',
          datePreset: flags['date-preset'] ?? 'last_7d',
          limit: flags.limit,
        });

        // Build lookup map by ad_id
        const insightsMap = new Map<string, Insights>();
        for (const insight of insights) {
          if (insight.ad_id) {
            insightsMap.set(insight.ad_id, insight);
          }
        }

        // Merge ads with insights
        let merged = result.data.map((ad) => mergeAdWithInsights(ad, insightsMap));

        // Add creative context if requested
        if (flags['include-creative']) {
          merged = merged.map((m, i) => {
            const ad = result.data[i];
            const creative = processCreative(ad.creative);
            return creative ? { ...m, creative } : m;
          });
        }

        // Apply filters
        if (flags['min-spend'] !== undefined) {
          merged = merged.filter((a) => a.spend >= flags['min-spend']!);
        }
        if (flags['min-results'] !== undefined) {
          merged = merged.filter((a) => a.results >= flags['min-results']!);
        }

        // Sort if requested
        if (flags['sort-by']) {
          const sortKey = flags['sort-by'] as keyof AdWithInsights;
          merged = merged.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            // For cost metrics, lower is better (ascending), nulls go to end
            if (sortKey === 'cost_per_result') {
              if (aVal === null && bVal === null) return 0;
              if (aVal === null) return 1;
              if (bVal === null) return -1;
              return (aVal as number) - (bVal as number);
            }
            // For volume metrics, higher is better (descending)
            return ((bVal as number) ?? 0) - ((aVal as number) ?? 0);
          });
        }

        this.outputSuccess(merged, this.client.getAccountId());
      } else {
        const columns: TableColumn<Ad>[] = [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'status', header: 'Status' },
          { key: 'effective_status', header: 'Effective' },
          { key: 'adset_id', header: 'Ad Set ID' },
        ];

        this.outputSuccess(result.data, this.client.getAccountId(), columns);
      }
    });
  }
}
