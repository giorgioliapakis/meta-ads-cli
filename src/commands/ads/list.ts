import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Ad, Insights } from '../../types/index.js';
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
