import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Insights } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

const DATE_PRESETS = [
  'today', 'yesterday', 'this_month', 'last_month', 'this_quarter',
  'maximum', 'data_maximum', 'last_3d', 'last_7d', 'last_14d',
  'last_28d', 'last_30d', 'last_90d', 'last_week_mon_sun',
  'last_week_sun_sat', 'last_quarter', 'last_year', 'this_week_mon_today',
  'this_week_sun_today', 'this_year',
];

// Key conversion actions we care about (in priority order)
const CONVERSION_ACTIONS = [
  'purchase', 'lead', 'complete_registration', 'subscribe', 'add_to_cart',
  'initiate_checkout', 'app_install', 'link_click', 'landing_page_view',
];

interface FlatInsight {
  // Identity
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  // Entity status (populated by --active-only)
  status?: string;
  // Core metrics
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  // Results (primary conversion)
  results: number;
  result_type: string;
  cost_per_result: number | null;
  // Secondary metrics
  link_clicks: number;
  landing_page_views: number;
  // Date range
  date_start: string;
  date_stop: string;
}

// Ultra-minimal output for agents - just what's needed for decisions
interface CompactInsight {
  name: string;
  id: string;
  spend: number;
  results: number;
  cost_per_result: number | null;
  result_type: string;
}

// Aggregated summary for quick decision-making
interface InsightsSummary {
  total_spend: number;
  total_results: number;
  total_impressions: number;
  avg_cost_per_result: number | null;
  avg_ctr: number;
  entity_count: number;
  with_results_count: number;
  best_performer: { name: string; id: string; cost_per_result: number } | null;
  worst_performer: { name: string; id: string; cost_per_result: number } | null;
  date_start: string;
  date_stop: string;
}

// Period comparison for trend analysis
interface PeriodComparison {
  current_period: { start: string; end: string };
  previous_period: { start: string; end: string };
  spend: { current: number; previous: number; change_pct: number };
  results: { current: number; previous: number; change_pct: number };
  impressions: { current: number; previous: number; change_pct: number };
  cost_per_result: { current: number | null; previous: number | null; change_pct: number | null };
  ctr: { current: number; previous: number; change_pct: number };
  trend: 'improving' | 'declining' | 'stable';
}

function generateSummary(flattened: FlatInsight[], level: string): InsightsSummary {
  const totalSpend = flattened.reduce((sum, f) => sum + f.spend, 0);
  const totalResults = flattened.reduce((sum, f) => sum + f.results, 0);
  const totalImpressions = flattened.reduce((sum, f) => sum + f.impressions, 0);
  const totalClicks = flattened.reduce((sum, f) => sum + f.clicks, 0);

  // Find best/worst performers (only those with results and cost_per_result)
  const withResults = flattened.filter((f) => f.results > 0 && f.cost_per_result !== null);

  let bestPerformer: InsightsSummary['best_performer'] = null;
  let worstPerformer: InsightsSummary['worst_performer'] = null;

  if (withResults.length > 0) {
    const sorted = [...withResults].sort((a, b) => (a.cost_per_result as number) - (b.cost_per_result as number));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const getName = (f: FlatInsight) => {
      if (level === 'ad') return { name: f.ad_name ?? '', id: f.ad_id ?? '' };
      if (level === 'adset') return { name: f.adset_name ?? '', id: f.adset_id ?? '' };
      if (level === 'campaign') return { name: f.campaign_name ?? '', id: f.campaign_id ?? '' };
      return { name: '', id: '' };
    };

    bestPerformer = { ...getName(best), cost_per_result: best.cost_per_result as number };
    worstPerformer = { ...getName(worst), cost_per_result: worst.cost_per_result as number };
  }

  return {
    total_spend: Math.round(totalSpend * 100) / 100,
    total_results: totalResults,
    total_impressions: totalImpressions,
    avg_cost_per_result: totalResults > 0 ? Math.round((totalSpend / totalResults) * 100) / 100 : null,
    avg_ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    entity_count: flattened.length,
    with_results_count: withResults.length,
    best_performer: bestPerformer,
    worst_performer: worstPerformer,
    date_start: flattened[0]?.date_start ?? '',
    date_stop: flattened[0]?.date_stop ?? '',
  };
}

function generateComparison(current: FlatInsight[], previous: FlatInsight[]): PeriodComparison {
  const calcChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 10000) / 100;
  };

  const currSpend = current.reduce((s, f) => s + f.spend, 0);
  const prevSpend = previous.reduce((s, f) => s + f.spend, 0);
  const currResults = current.reduce((s, f) => s + f.results, 0);
  const prevResults = previous.reduce((s, f) => s + f.results, 0);
  const currImpressions = current.reduce((s, f) => s + f.impressions, 0);
  const prevImpressions = previous.reduce((s, f) => s + f.impressions, 0);
  const currClicks = current.reduce((s, f) => s + f.clicks, 0);
  const prevClicks = previous.reduce((s, f) => s + f.clicks, 0);

  const currCPR = currResults > 0 ? currSpend / currResults : null;
  const prevCPR = prevResults > 0 ? prevSpend / prevResults : null;
  const currCTR = currImpressions > 0 ? (currClicks / currImpressions) * 100 : 0;
  const prevCTR = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;

  // Determine trend based on cost per result (lower is better)
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (currCPR !== null && prevCPR !== null) {
    const cprChange = ((currCPR - prevCPR) / prevCPR) * 100;
    if (cprChange < -10) trend = 'improving';
    else if (cprChange > 10) trend = 'declining';
  } else if (currResults > prevResults) {
    trend = 'improving';
  } else if (currResults < prevResults) {
    trend = 'declining';
  }

  return {
    current_period: {
      start: current[0]?.date_start ?? '',
      end: current[0]?.date_stop ?? '',
    },
    previous_period: {
      start: previous[0]?.date_start ?? '',
      end: previous[0]?.date_stop ?? '',
    },
    spend: {
      current: Math.round(currSpend * 100) / 100,
      previous: Math.round(prevSpend * 100) / 100,
      change_pct: calcChange(currSpend, prevSpend),
    },
    results: {
      current: currResults,
      previous: prevResults,
      change_pct: calcChange(currResults, prevResults),
    },
    impressions: {
      current: currImpressions,
      previous: prevImpressions,
      change_pct: calcChange(currImpressions, prevImpressions),
    },
    cost_per_result: {
      current: currCPR !== null ? Math.round(currCPR * 100) / 100 : null,
      previous: prevCPR !== null ? Math.round(prevCPR * 100) / 100 : null,
      change_pct: currCPR !== null && prevCPR !== null ? calcChange(currCPR, prevCPR) : null,
    },
    ctr: {
      current: Math.round(currCTR * 100) / 100,
      previous: Math.round(prevCTR * 100) / 100,
      change_pct: calcChange(currCTR, prevCTR),
    },
    trend,
  };
}

function toCompactInsight(flat: FlatInsight, level: string): CompactInsight {
  // Get appropriate name/id based on level
  let name = '';
  let id = '';
  if (level === 'ad') {
    name = flat.ad_name ?? '';
    id = flat.ad_id ?? '';
  } else if (level === 'adset') {
    name = flat.adset_name ?? '';
    id = flat.adset_id ?? '';
  } else if (level === 'campaign') {
    name = flat.campaign_name ?? '';
    id = flat.campaign_id ?? '';
  }

  return {
    name,
    id,
    spend: flat.spend,
    results: flat.results,
    cost_per_result: flat.cost_per_result,
    result_type: flat.result_type,
  };
}

function flattenInsight(insight: Insights): FlatInsight {
  const actions = insight.actions ?? [];
  const costs = insight.cost_per_action_type ?? [];

  // Find primary conversion (first match in priority order)
  let resultType = 'none';
  let results = 0;
  let costPerResult: number | null = null;

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

  // Extract specific metrics we care about
  const linkClicks = Number(actions.find((a) => a.action_type === 'link_click')?.value ?? 0);
  const landingPageViews = Number(actions.find((a) => a.action_type === 'landing_page_view')?.value ?? 0);

  return {
    // Identity (only include if present)
    ...(insight.ad_id && { ad_id: insight.ad_id }),
    ...(insight.ad_name && { ad_name: insight.ad_name }),
    ...(insight.adset_id && { adset_id: insight.adset_id }),
    ...(insight.adset_name && { adset_name: insight.adset_name }),
    ...(insight.campaign_id && { campaign_id: insight.campaign_id }),
    ...(insight.campaign_name && { campaign_name: insight.campaign_name }),
    // Core metrics
    spend: Number(insight.spend ?? 0),
    impressions: Number(insight.impressions ?? 0),
    reach: Number(insight.reach ?? 0),
    clicks: Number(insight.clicks ?? 0),
    ctr: Number(insight.ctr ?? 0),
    cpc: Number(insight.cpc ?? 0),
    cpm: Number(insight.cpm ?? 0),
    // Results
    results,
    result_type: resultType,
    cost_per_result: costPerResult,
    // Secondary
    link_clicks: linkClicks,
    landing_page_views: landingPageViews,
    // Dates
    date_start: insight.date_start ?? '',
    date_stop: insight.date_stop ?? '',
  };
}

export default class Get extends AuthenticatedCommand {
  static override description = 'Get performance insights/metrics';

  static override examples = [
    '<%= config.bin %> insights get --level campaign --date-preset last_7d',
    '<%= config.bin %> insights get --level ad --date-preset last_7d --flatten',
    '<%= config.bin %> insights get --level ad --date-preset last_7d --flatten --sort-by cost_per_result',
    // Agent-optimized examples
    '<%= config.bin %> insights get --level ad --date-preset last_7d --compact --min-spend 5',
    '<%= config.bin %> insights get --level ad --date-preset last_7d --compact --sort-by cost_per_result --min-results 1',
    '<%= config.bin %> insights get --level ad --date-preset last_7d --summary',
    '<%= config.bin %> insights get --level campaign --compare last_7d:last_14d',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    level: Flags.string({ description: 'Aggregation level', required: true, options: ['account', 'campaign', 'adset', 'ad'] }),
    'date-preset': Flags.string({ description: 'Date preset', options: DATE_PRESETS }),
    'date-range': Flags.string({ description: 'Date range (YYYY-MM-DD:YYYY-MM-DD)' }),
    breakdowns: Flags.string({ description: 'Comma-separated breakdowns (age, gender, country, etc.)' }),
    fields: Flags.string({ description: 'Comma-separated metrics to include' }),
    limit: Flags.integer({ char: 'l', description: 'Maximum results', default: 25 }),
    flatten: Flags.boolean({ description: 'Flatten output: extract key metrics, remove nested arrays', default: false }),
    'sort-by': Flags.string({ description: 'Sort by metric (spend, results, cost_per_result, ctr, impressions)' }),
    // Agent-optimized filters
    'min-spend': Flags.integer({ description: 'Filter: minimum spend amount (e.g., 5 = $5+)' }),
    'min-impressions': Flags.integer({ description: 'Filter: minimum impressions (e.g., 100)' }),
    'min-results': Flags.integer({ description: 'Filter: minimum results/conversions' }),
    'active-only': Flags.boolean({ description: 'Filter: only show active entities (requires extra API call)', default: false }),
    'result-type': Flags.string({ description: 'Filter by result type (lead, purchase, link_click, etc.)' }),
    compact: Flags.boolean({ description: 'Ultra-minimal output: name, spend, results, cost_per_result only', default: false }),
    summary: Flags.boolean({ description: 'Aggregated summary: totals, averages, best/worst performers', default: false }),
    compare: Flags.string({ description: 'Compare periods (e.g., last_7d:previous_7d or this_week:last_week)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      // Handle period comparison
      if (flags.compare) {
        const [currentPreset, previousPreset] = flags.compare.split(':');
        if (!currentPreset || !previousPreset) {
          throw new Error('Compare format must be "current_preset:previous_preset" (e.g., last_7d:previous_7d)');
        }

        // Fetch both periods
        const [currentInsights, previousInsights] = await Promise.all([
          this.client.getInsights({
            level: flags.level as 'account' | 'campaign' | 'adset' | 'ad',
            datePreset: currentPreset,
            limit: flags.limit,
          }),
          this.client.getInsights({
            level: flags.level as 'account' | 'campaign' | 'adset' | 'ad',
            datePreset: previousPreset,
            limit: flags.limit,
          }),
        ]);

        const currentFlat = currentInsights.map(flattenInsight);
        const previousFlat = previousInsights.map(flattenInsight);

        const comparison = generateComparison(currentFlat, previousFlat);
        this.outputSuccess(comparison, this.client.getAccountId());
        return;
      }

      let dateRange: { start: string; end: string } | undefined;
      if (flags['date-range']) {
        const [start, end] = flags['date-range'].split(':');
        dateRange = { start, end };
      }

      const insights = await this.client.getInsights({
        level: flags.level as 'account' | 'campaign' | 'adset' | 'ad',
        datePreset: flags['date-preset'],
        dateRange,
        breakdowns: flags.breakdowns?.split(','),
        fields: flags.fields?.split(','),
        limit: flags.limit,
      });

      if (flags.flatten || flags.compact || flags.summary) {
        let flattened = insights.map(flattenInsight);

        // Fetch entity statuses if --active-only is set
        if (flags['active-only'] && flags.level !== 'account') {
          const statusMap = new Map<string, string>();

          if (flags.level === 'ad') {
            const ads = await this.client.listAds({ limit: 100, all: true });
            for (const ad of ads.data) {
              statusMap.set(ad.id, ad.effective_status);
            }
          } else if (flags.level === 'adset') {
            const adsets = await this.client.listAdSets({ limit: 100, all: true });
            for (const adset of adsets.data) {
              statusMap.set(adset.id, adset.effective_status);
            }
          } else if (flags.level === 'campaign') {
            const campaigns = await this.client.listCampaigns({ limit: 100, all: true });
            for (const campaign of campaigns.data) {
              statusMap.set(campaign.id, campaign.effective_status);
            }
          }

          // Add status to flattened and filter to active only
          flattened = flattened
            .map((f) => {
              const id = f.ad_id ?? f.adset_id ?? f.campaign_id;
              return { ...f, status: id ? statusMap.get(id) : undefined };
            })
            .filter((f) => f.status === 'ACTIVE');
        }

        // Apply metric filters
        if (flags['min-spend'] !== undefined) {
          flattened = flattened.filter((f) => f.spend >= flags['min-spend']!);
        }
        if (flags['min-impressions'] !== undefined) {
          flattened = flattened.filter((f) => f.impressions >= flags['min-impressions']!);
        }
        if (flags['min-results'] !== undefined) {
          flattened = flattened.filter((f) => f.results >= flags['min-results']!);
        }
        if (flags['result-type']) {
          flattened = flattened.filter((f) => f.result_type === flags['result-type']);
        }

        // Sort if requested
        if (flags['sort-by']) {
          const sortKey = flags['sort-by'] as keyof FlatInsight;
          flattened = flattened.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            // For cost metrics, lower is better (ascending), nulls go to end
            if (sortKey === 'cost_per_result' || sortKey === 'cpc' || sortKey === 'cpm') {
              if (aVal === null && bVal === null) return 0;
              if (aVal === null) return 1;  // a goes after b
              if (bVal === null) return -1; // b goes after a
              return (aVal as number) - (bVal as number);
            }
            // For volume metrics, higher is better (descending)
            return ((bVal as number) ?? 0) - ((aVal as number) ?? 0);
          });
        }

        // Output based on mode
        if (flags.summary) {
          const summary = generateSummary(flattened, flags.level);
          this.outputSuccess(summary, this.client.getAccountId());
        } else if (flags.compact) {
          const compacted = flattened.map((f) => toCompactInsight(f, flags.level));
          this.outputSuccess(compacted, this.client.getAccountId());
        } else {
          this.outputSuccess(flattened, this.client.getAccountId());
        }
      } else {
        const columns: TableColumn<Insights>[] = [
          { key: 'date_start', header: 'Start' },
          { key: 'date_stop', header: 'End' },
          { key: 'impressions', header: 'Impressions' },
          { key: 'clicks', header: 'Clicks' },
          { key: 'spend', header: 'Spend' },
          { key: 'ctr', header: 'CTR' },
        ];

        this.outputSuccess(insights, this.client.getAccountId(), columns);
      }
    });
  }
}
