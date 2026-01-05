import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Insights } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';
import {
  CONVERSION_ACTIONS,
  DATE_PRESETS,
  OBJECTIVE_TO_ACTION,
  parseComparePresets,
} from '../../lib/constants.js';

interface FlatInsight {
  // Identity
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  // Campaign context (populated when available)
  campaign_objective?: string;
  // Entity status (populated by --active-only)
  status?: string;
  // Budget context (populated by --with-budget at appropriate level)
  daily_budget?: number;
  budget_remaining?: number;
  budget_pct_used?: number;
  // Delivery context (populated by --include-delivery)
  delivery_status?: string;
  learning_phase?: string;
  delivery_issues?: string[];
  // Core metrics
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  // Primary objective results (based on campaign objective)
  objective_result_type?: string;
  objective_results?: number;
  objective_cost_per_result?: number | null;
  // Results (highest priority conversion found)
  results: number;
  result_type: string;
  cost_per_result: number | null;
  // All actions summary (populated by --include-all-actions)
  actions_summary?: {
    purchases?: number;
    leads?: number;
    complete_registrations?: number;
    add_to_carts?: number;
    initiate_checkouts?: number;
    app_installs?: number;
    link_clicks?: number;
    landing_page_views?: number;
  };
  // Secondary metrics (always included for funnel analysis)
  link_clicks: number;
  landing_page_views: number;
  // Funnel conversion rates
  click_rate?: number;      // clicks / impressions (same as ctr, included for clarity)
  lpv_rate?: number;        // landing_page_views / clicks
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
  // Optional context fields (added by flags)
  daily_budget?: number;
  budget_remaining?: number;
  budget_pct_used?: number;
  delivery_status?: string;
  learning_phase?: string;
  delivery_issues?: string[];
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
  // Neutral naming - lowest/highest CPR instead of best/worst
  lowest_cpr: { name: string; id: string; cost_per_result: number } | null;
  highest_cpr: { name: string; id: string; cost_per_result: number } | null;
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

// Breakdowns summary for quick analysis
interface BreakdownPerformer {
  value: string;
  spend: number;
  results: number;
  cost_per_result: number | null;
}

interface BreakdownDimension {
  dimension: string;
  best: BreakdownPerformer | null;
  worst: BreakdownPerformer | null;
  all_values: BreakdownPerformer[];
}

interface BreakdownsSummary {
  dimensions: BreakdownDimension[];
  totals: {
    spend: number;
    results: number;
    cost_per_result: number | null;
  };
  date_start: string;
  date_stop: string;
}

function generateSummary(flattened: FlatInsight[], level: string): InsightsSummary {
  const totalSpend = flattened.reduce((sum, f) => sum + f.spend, 0);
  const totalResults = flattened.reduce((sum, f) => sum + f.results, 0);
  const totalImpressions = flattened.reduce((sum, f) => sum + f.impressions, 0);
  const totalClicks = flattened.reduce((sum, f) => sum + f.clicks, 0);

  // Find lowest/highest CPR (only those with results and cost_per_result)
  const withResults = flattened.filter((f) => f.results > 0 && f.cost_per_result !== null);

  let lowestCpr: InsightsSummary['lowest_cpr'] = null;
  let highestCpr: InsightsSummary['highest_cpr'] = null;

  if (withResults.length > 0) {
    const sorted = [...withResults].sort((a, b) => (a.cost_per_result as number) - (b.cost_per_result as number));
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    const getName = (f: FlatInsight) => {
      if (level === 'ad') return { name: f.ad_name ?? '', id: f.ad_id ?? '' };
      if (level === 'adset') return { name: f.adset_name ?? '', id: f.adset_id ?? '' };
      if (level === 'campaign') return { name: f.campaign_name ?? '', id: f.campaign_id ?? '' };
      return { name: '', id: '' };
    };

    lowestCpr = { ...getName(lowest), cost_per_result: lowest.cost_per_result as number };
    highestCpr = { ...getName(highest), cost_per_result: highest.cost_per_result as number };
  }

  return {
    total_spend: Math.round(totalSpend * 100) / 100,
    total_results: totalResults,
    total_impressions: totalImpressions,
    avg_cost_per_result: totalResults > 0 ? Math.round((totalSpend / totalResults) * 100) / 100 : null,
    avg_ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    entity_count: flattened.length,
    with_results_count: withResults.length,
    lowest_cpr: lowestCpr,
    highest_cpr: highestCpr,
    date_start: flattened[0]?.date_start ?? '',
    date_stop: flattened[0]?.date_stop ?? '',
  };
}

function generateBreakdownsSummary(insights: Insights[], breakdownFields: string[]): BreakdownsSummary {
  // Calculate totals
  const totalSpend = insights.reduce((sum, i) => sum + Number(i.spend ?? 0), 0);
  const totalResults = insights.reduce((sum, i) => {
    const actions = i.actions ?? [];
    for (const actionType of CONVERSION_ACTIONS) {
      const action = actions.find((a) =>
        a.action_type === actionType ||
        a.action_type === `offsite_conversion.fb_pixel_${actionType}` ||
        a.action_type === `onsite_web_${actionType}`
      );
      if (action) return sum + Number(action.value);
    }
    return sum;
  }, 0);

  const dimensions: BreakdownDimension[] = [];

  for (const dimension of breakdownFields) {
    // Aggregate by dimension value
    const valueMap = new Map<string, { spend: number; results: number }>();

    for (const insight of insights) {
      const value = (insight as unknown as Record<string, unknown>)[dimension] as string | undefined;
      if (!value) continue;

      const existing = valueMap.get(value) ?? { spend: 0, results: 0 };
      existing.spend += Number(insight.spend ?? 0);

      // Count results
      const actions = insight.actions ?? [];
      for (const actionType of CONVERSION_ACTIONS) {
        const action = actions.find((a) =>
          a.action_type === actionType ||
          a.action_type === `offsite_conversion.fb_pixel_${actionType}` ||
          a.action_type === `onsite_web_${actionType}`
        );
        if (action) {
          existing.results += Number(action.value);
          break;
        }
      }

      valueMap.set(value, existing);
    }

    // Convert to performers array
    const performers: BreakdownPerformer[] = [];
    for (const [value, data] of valueMap.entries()) {
      performers.push({
        value,
        spend: Math.round(data.spend * 100) / 100,
        results: data.results,
        cost_per_result: data.results > 0 ? Math.round((data.spend / data.results) * 100) / 100 : null,
      });
    }

    // Sort by cost_per_result (ascending - lower is better)
    const withResults = performers.filter((p) => p.results > 0 && p.cost_per_result !== null);
    withResults.sort((a, b) => (a.cost_per_result as number) - (b.cost_per_result as number));

    dimensions.push({
      dimension,
      best: withResults.length > 0 ? withResults[0] : null,
      worst: withResults.length > 0 ? withResults[withResults.length - 1] : null,
      all_values: performers.sort((a, b) => b.spend - a.spend), // Sort all by spend descending
    });
  }

  return {
    dimensions,
    totals: {
      spend: Math.round(totalSpend * 100) / 100,
      results: totalResults,
      cost_per_result: totalResults > 0 ? Math.round((totalSpend / totalResults) * 100) / 100 : null,
    },
    date_start: insights[0]?.date_start ?? '',
    date_stop: insights[0]?.date_stop ?? '',
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
    // Include optional context fields if present
    ...(flat.daily_budget !== undefined && { daily_budget: flat.daily_budget }),
    ...(flat.budget_remaining !== undefined && { budget_remaining: flat.budget_remaining }),
    ...(flat.budget_pct_used !== undefined && { budget_pct_used: flat.budget_pct_used }),
    ...(flat.delivery_status && { delivery_status: flat.delivery_status }),
    ...(flat.learning_phase && { learning_phase: flat.learning_phase }),
    ...(flat.delivery_issues && { delivery_issues: flat.delivery_issues }),
  };
}

// Helper to find action by type (supports qualified names)
function findAction(actions: { action_type: string; value: string }[], actionType: string): number {
  const action = actions.find((a) =>
    a.action_type === actionType ||
    a.action_type === `offsite_conversion.fb_pixel_${actionType}` ||
    a.action_type === `onsite_web_${actionType}`
  );
  return action ? Number(action.value) : 0;
}

// Helper to find cost by action type
function findCost(costs: { action_type: string; value: string }[], actionType: string): number | null {
  const cost = costs.find((c) =>
    c.action_type === actionType ||
    c.action_type === `offsite_conversion.fb_pixel_${actionType}` ||
    c.action_type === `onsite_web_${actionType}`
  );
  return cost ? Number(cost.value) : null;
}

interface FlattenOptions {
  includeAllActions?: boolean;
  campaignObjectives?: Map<string, string>;  // campaign_id -> objective
}

function flattenInsight(insight: Insights, options?: FlattenOptions): FlatInsight {
  const actions = insight.actions ?? [];
  const costs = insight.cost_per_action_type ?? [];

  // Find primary conversion (first match in priority order)
  let resultType = 'none';
  let results = 0;
  let costPerResult: number | null = null;

  for (const actionType of CONVERSION_ACTIONS) {
    const actionResults = findAction(actions, actionType);
    if (actionResults > 0) {
      resultType = actionType;
      results = actionResults;
      costPerResult = findCost(costs, actionType);
      break;
    }
  }

  // Extract specific metrics we care about
  const linkClicks = findAction(actions, 'link_click');
  const landingPageViews = findAction(actions, 'landing_page_view');
  const impressions = Number(insight.impressions ?? 0);
  const clicks = Number(insight.clicks ?? 0);

  // Calculate funnel rates
  const clickRate = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
  const lpvRate = clicks > 0 ? Math.round((landingPageViews / clicks) * 10000) / 100 : 0;

  // Build base insight
  const flat: FlatInsight = {
    // Identity (only include if present)
    ...(insight.ad_id && { ad_id: insight.ad_id }),
    ...(insight.ad_name && { ad_name: insight.ad_name }),
    ...(insight.adset_id && { adset_id: insight.adset_id }),
    ...(insight.adset_name && { adset_name: insight.adset_name }),
    ...(insight.campaign_id && { campaign_id: insight.campaign_id }),
    ...(insight.campaign_name && { campaign_name: insight.campaign_name }),
    // Core metrics
    spend: Number(insight.spend ?? 0),
    impressions,
    reach: Number(insight.reach ?? 0),
    clicks,
    ctr: Number(insight.ctr ?? 0),
    cpc: Number(insight.cpc ?? 0),
    cpm: Number(insight.cpm ?? 0),
    // Results (highest priority found)
    results,
    result_type: resultType,
    cost_per_result: costPerResult,
    // Secondary metrics
    link_clicks: linkClicks,
    landing_page_views: landingPageViews,
    // Funnel rates
    click_rate: clickRate,
    lpv_rate: lpvRate,
    // Dates
    date_start: insight.date_start ?? '',
    date_stop: insight.date_stop ?? '',
  };

  // Add campaign objective context if available
  if (options?.campaignObjectives && insight.campaign_id) {
    const objective = options.campaignObjectives.get(insight.campaign_id);
    if (objective) {
      flat.campaign_objective = objective;

      // Calculate objective-specific results
      const objectiveActionType = OBJECTIVE_TO_ACTION[objective];
      if (objectiveActionType) {
        flat.objective_result_type = objectiveActionType;
        flat.objective_results = findAction(actions, objectiveActionType);
        flat.objective_cost_per_result = findCost(costs, objectiveActionType);
      }
    }
  }

  // Add all actions summary if requested
  if (options?.includeAllActions) {
    flat.actions_summary = {
      purchases: findAction(actions, 'purchase') || undefined,
      leads: findAction(actions, 'lead') || undefined,
      complete_registrations: findAction(actions, 'complete_registration') || undefined,
      add_to_carts: findAction(actions, 'add_to_cart') || undefined,
      initiate_checkouts: findAction(actions, 'initiate_checkout') || undefined,
      app_installs: findAction(actions, 'app_install') || undefined,
      link_clicks: linkClicks || undefined,
      landing_page_views: landingPageViews || undefined,
    };
    // Remove undefined values
    flat.actions_summary = Object.fromEntries(
      Object.entries(flat.actions_summary).filter(([, v]) => v !== undefined)
    ) as FlatInsight['actions_summary'];
  }

  return flat;
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
    'date-preset': Flags.string({ description: 'Date preset', options: [...DATE_PRESETS] }),
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
    'with-budget': Flags.boolean({ description: 'Include budget context (daily_budget, budget_remaining, budget_pct_used)', default: false }),
    'include-delivery': Flags.boolean({ description: 'Include delivery status (delivery_status, learning_phase, delivery_issues)', default: false }),
    'include-objective': Flags.boolean({ description: 'Include campaign objective and objective-specific metrics', default: false }),
    'include-all-actions': Flags.boolean({ description: 'Include summary of all action types (purchases, leads, etc.)', default: false }),
    compact: Flags.boolean({ description: 'Ultra-minimal output: name, spend, results, cost_per_result only', default: false }),
    summary: Flags.boolean({ description: 'Aggregated summary: totals, averages, lowest/highest CPR', default: false }),
    'breakdowns-summary': Flags.boolean({ description: 'Summarize breakdowns: lowest/highest CPR per dimension (requires --breakdowns)', default: false }),
    compare: Flags.string({ description: 'Compare periods (e.g., last_7d:previous_7d for non-overlapping comparison)' }),
    // Token efficiency flags
    top: Flags.integer({ description: 'Return only top N results (by sort metric or CPR)', default: undefined }),
    bottom: Flags.integer({ description: 'Return only bottom N results (by sort metric or CPR)', default: undefined }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      // Handle period comparison
      if (flags.compare) {
        const parsed = parseComparePresets(flags.compare);

        // Log warning if periods overlap
        if (parsed.warning && !flags.quiet) {
          console.error(parsed.warning);
        }

        // Fetch both periods - use date range for previous if calculated
        const [currentInsights, previousInsights] = await Promise.all([
          this.client.getInsights({
            level: flags.level as 'account' | 'campaign' | 'adset' | 'ad',
            datePreset: parsed.current.preset,
            dateRange: parsed.current.dateRange,
            limit: flags.limit,
          }),
          this.client.getInsights({
            level: flags.level as 'account' | 'campaign' | 'adset' | 'ad',
            datePreset: parsed.previous.preset,
            dateRange: parsed.previous.dateRange,
            limit: flags.limit,
          }),
        ]);

        const currentFlat = currentInsights.map((i) => flattenInsight(i));
        const previousFlat = previousInsights.map((i) => flattenInsight(i));

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

      // Handle breakdowns summary mode
      if (flags['breakdowns-summary']) {
        if (!flags.breakdowns) {
          throw new Error('--breakdowns-summary requires --breakdowns to be specified');
        }
        const breakdownFields = flags.breakdowns.split(',');
        const summary = generateBreakdownsSummary(insights, breakdownFields);
        this.outputSuccess(summary, this.client.getAccountId());
        return;
      }

      if (flags.flatten || flags.compact || flags.summary) {
        // Build flatten options
        const flattenOptions: FlattenOptions = {
          includeAllActions: flags['include-all-actions'],
        };

        // Fetch campaign objectives if requested
        if (flags['include-objective']) {
          const campaigns = await this.client.listCampaigns({ limit: 100, all: true });
          flattenOptions.campaignObjectives = new Map<string, string>();
          for (const campaign of campaigns.data) {
            flattenOptions.campaignObjectives.set(campaign.id, campaign.objective);
          }
        }

        let flattened = insights.map((i) => flattenInsight(i, flattenOptions));

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

        // Fetch budget context if requested
        // Note: Budget is added at campaign level only to avoid duplication
        if (flags['with-budget']) {
          if (flags.level === 'campaign') {
            // At campaign level, add budget directly from campaign data
            const campaigns = await this.client.listCampaigns({ limit: 100, all: true });
            const budgetMap = new Map<string, { daily_budget: number; budget_remaining: number }>();

            for (const campaign of campaigns.data) {
              if (campaign.daily_budget || campaign.lifetime_budget) {
                budgetMap.set(campaign.id, {
                  daily_budget: Number(campaign.daily_budget ?? campaign.lifetime_budget ?? 0) / 100,
                  budget_remaining: Number(campaign.budget_remaining ?? 0) / 100,
                });
              }
            }

            flattened = flattened.map((f) => {
              const budget = f.campaign_id ? budgetMap.get(f.campaign_id) : undefined;
              if (budget) {
                const pctUsed = budget.daily_budget > 0
                  ? Math.round(((budget.daily_budget - budget.budget_remaining) / budget.daily_budget) * 100)
                  : 0;
                return {
                  ...f,
                  daily_budget: budget.daily_budget,
                  budget_remaining: budget.budget_remaining,
                  budget_pct_used: pctUsed,
                };
              }
              return f;
            });
          } else if (flags.level === 'adset') {
            // At ad set level, fetch ad set budgets
            const adsets = await this.client.listAdSets({ limit: 100, all: true });
            const budgetMap = new Map<string, { daily_budget: number; budget_remaining: number }>();

            for (const adset of adsets.data) {
              if (adset.daily_budget || adset.lifetime_budget) {
                budgetMap.set(adset.id, {
                  daily_budget: Number(adset.daily_budget ?? adset.lifetime_budget ?? 0) / 100,
                  budget_remaining: Number(adset.budget_remaining ?? 0) / 100,
                });
              }
            }

            flattened = flattened.map((f) => {
              const budget = f.adset_id ? budgetMap.get(f.adset_id) : undefined;
              if (budget) {
                const pctUsed = budget.daily_budget > 0
                  ? Math.round(((budget.daily_budget - budget.budget_remaining) / budget.daily_budget) * 100)
                  : 0;
                return {
                  ...f,
                  daily_budget: budget.daily_budget,
                  budget_remaining: budget.budget_remaining,
                  budget_pct_used: pctUsed,
                };
              }
              return f;
            });
          }
          // Note: Budget at ad level is inherited from ad set/campaign
          // To avoid duplication, we don't add budget fields at ad level
          // Users should query at adset level for budget info
        }

        // Fetch delivery status if requested
        if (flags['include-delivery'] && flags.level !== 'account') {
          interface DeliveryInfo {
            effective_status: string;
            learning_phase?: string;
            issues?: string[];
          }
          const deliveryMap = new Map<string, DeliveryInfo>();

          if (flags.level === 'ad') {
            // For ads, we need both ad issues and adset learning phase
            const [ads, adsets] = await Promise.all([
              this.client.listAds({ limit: 100, all: true, includeDelivery: true }),
              this.client.listAdSets({ limit: 100, all: true, includeDelivery: true }),
            ]);

            // Build adset learning phase map
            const adsetLearningMap = new Map<string, string>();
            for (const adset of adsets.data) {
              if (adset.learning_phase_info?.status) {
                adsetLearningMap.set(adset.id, adset.learning_phase_info.status);
              }
            }

            // Build delivery map for ads
            for (const ad of ads.data) {
              const issues = ad.issues_info?.map((i) => i.error_summary) ?? [];
              deliveryMap.set(ad.id, {
                effective_status: ad.effective_status,
                learning_phase: ad.adset_id ? adsetLearningMap.get(ad.adset_id) : undefined,
                issues: issues.length > 0 ? issues : undefined,
              });
            }
          } else if (flags.level === 'adset') {
            const adsets = await this.client.listAdSets({ limit: 100, all: true, includeDelivery: true });
            for (const adset of adsets.data) {
              const issues = adset.issues_info?.map((i) => i.error_summary) ?? [];
              deliveryMap.set(adset.id, {
                effective_status: adset.effective_status,
                learning_phase: adset.learning_phase_info?.status,
                issues: issues.length > 0 ? issues : undefined,
              });
            }
          } else if (flags.level === 'campaign') {
            const campaigns = await this.client.listCampaigns({ limit: 100, all: true });
            for (const campaign of campaigns.data) {
              deliveryMap.set(campaign.id, {
                effective_status: campaign.effective_status,
              });
            }
          }

          // Add delivery info to each insight
          flattened = flattened.map((f) => {
            const id = f.ad_id ?? f.adset_id ?? f.campaign_id;
            const delivery = id ? deliveryMap.get(id) : undefined;
            if (delivery) {
              return {
                ...f,
                delivery_status: delivery.effective_status,
                ...(delivery.learning_phase && { learning_phase: delivery.learning_phase }),
                ...(delivery.issues && { delivery_issues: delivery.issues }),
              };
            }
            return f;
          });
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

        // Sort if requested (or default sort by CPR if using --top/--bottom)
        const needsSort = flags['sort-by'] || flags.top || flags.bottom;
        if (needsSort) {
          const sortKey = (flags['sort-by'] ?? 'cost_per_result') as keyof FlatInsight;
          flattened = flattened.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            // For cost metrics, lower is better (ascending), nulls go to end
            if (sortKey === 'cost_per_result' || sortKey === 'cpc' || sortKey === 'cpm' || sortKey === 'objective_cost_per_result') {
              if (aVal === null && bVal === null) return 0;
              if (aVal === null) return 1;  // a goes after b
              if (bVal === null) return -1; // b goes after a
              return (aVal as number) - (bVal as number);
            }
            // For volume metrics, higher is better (descending)
            return ((bVal as number) ?? 0) - ((aVal as number) ?? 0);
          });
        }

        // Apply --top and --bottom filters for token efficiency
        if (flags.top !== undefined || flags.bottom !== undefined) {
          const topN = flags.top ?? 0;
          const bottomN = flags.bottom ?? 0;

          if (topN > 0 && bottomN > 0) {
            // Get both top and bottom
            const top = flattened.slice(0, topN);
            const bottom = flattened.slice(-bottomN);
            // Combine, removing duplicates if overlap
            const bottomIds = new Set(bottom.map((f) => f.ad_id ?? f.adset_id ?? f.campaign_id));
            const combined = [...top.filter((f) => !bottomIds.has(f.ad_id ?? f.adset_id ?? f.campaign_id)), ...bottom];
            flattened = combined;
          } else if (topN > 0) {
            flattened = flattened.slice(0, topN);
          } else if (bottomN > 0) {
            flattened = flattened.slice(-bottomN);
          }
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
