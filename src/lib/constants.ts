/**
 * Shared constants for meta-ads CLI
 */

/**
 * Conversion action types in priority order.
 * Used for extracting the primary result from insights.
 * Higher priority actions (purchases, leads) are checked first.
 */
export const CONVERSION_ACTIONS = [
  'purchase',
  'lead',
  'complete_registration',
  'subscribe',
  'add_to_cart',
  'initiate_checkout',
  'app_install',
  'link_click',
  'landing_page_view',
] as const;

export type ConversionAction = typeof CONVERSION_ACTIONS[number];

/**
 * Date presets supported by Meta API
 */
export const DATE_PRESETS = [
  'today',
  'yesterday',
  'this_month',
  'last_month',
  'this_quarter',
  'maximum',
  'data_maximum',
  'last_3d',
  'last_7d',
  'last_14d',
  'last_28d',
  'last_30d',
  'last_90d',
  'last_week_mon_sun',
  'last_week_sun_sat',
  'last_quarter',
  'last_year',
  'this_week_mon_today',
  'this_week_sun_today',
  'this_year',
] as const;

export type DatePreset = typeof DATE_PRESETS[number];

/**
 * Map campaign objectives to their primary conversion action
 */
export const OBJECTIVE_TO_ACTION: Record<string, ConversionAction> = {
  'OUTCOME_LEADS': 'lead',
  'OUTCOME_SALES': 'purchase',
  'OUTCOME_ENGAGEMENT': 'link_click',
  'OUTCOME_TRAFFIC': 'link_click',
  'OUTCOME_AWARENESS': 'link_click',
  'OUTCOME_APP_PROMOTION': 'app_install',
};

/**
 * Calculate date range for "previous_Xd" comparison periods.
 * For example, if current period is last_7d, previous_7d should be
 * the 7 days before that (days 8-14 ago).
 */
export function calculatePreviousPeriod(currentPreset: string): { since: string; until: string } | null {
  const match = currentPreset.match(/^last_(\d+)d$/);
  if (!match) return null;

  const days = parseInt(match[1], 10);
  const today = new Date();

  // Current period is: (today - days) to (today - 1)
  // Previous period is: (today - 2*days) to (today - days - 1)
  const previousEnd = new Date(today);
  previousEnd.setDate(previousEnd.getDate() - days - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days + 1);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    since: formatDate(previousStart),
    until: formatDate(previousEnd),
  };
}

/**
 * Parse a compare string and return the appropriate date ranges/presets.
 * Supports formats:
 * - "last_7d:previous_7d" - last 7 days vs the 7 days before that
 * - "last_7d:last_14d" - (legacy, but overlaps - will warn)
 */
/**
 * Video fields for insights API
 */
export const VIDEO_FIELDS = [
  'video_play_actions',
  'video_thruplay_watched_actions',
  'video_p25_watched_actions',
  'video_p50_watched_actions',
  'video_p75_watched_actions',
  'video_p100_watched_actions',
] as const;

/**
 * Extract value from video action array.
 * Video actions are returned as arrays with a single object containing the total.
 */
export function getVideoActionValue(actions: { action_type: string; value: string }[] | undefined): number {
  if (!actions || actions.length === 0) return 0;
  // Video actions typically have action_type like "video_view" with the value
  const total = actions.find((a) => a.action_type === 'video_view');
  return total ? Number(total.value) : Number(actions[0]?.value ?? 0);
}

export function parseComparePresets(compareStr: string): {
  current: { preset?: string; dateRange?: { since: string; until: string } };
  previous: { preset?: string; dateRange?: { since: string; until: string } };
  warning?: string;
} {
  const [currentPreset, previousPreset] = compareStr.split(':');

  if (!currentPreset || !previousPreset) {
    throw new Error('Compare format must be "current:previous" (e.g., last_7d:previous_7d)');
  }

  // Handle "previous_Xd" format - calculate non-overlapping date range
  if (previousPreset.startsWith('previous_')) {
    const previousDays = previousPreset.match(/^previous_(\d+)d$/);
    if (previousDays) {
      const prevRange = calculatePreviousPeriod(currentPreset);
      if (prevRange) {
        return {
          current: { preset: currentPreset },
          previous: { dateRange: prevRange },
        };
      }
    }
    throw new Error(`Invalid previous period format: ${previousPreset}. Use format like "previous_7d"`);
  }

  // Check for overlapping presets and warn
  const currentMatch = currentPreset.match(/^last_(\d+)d$/);
  const previousMatch = previousPreset.match(/^last_(\d+)d$/);

  let warning: string | undefined;
  if (currentMatch && previousMatch) {
    const currentDays = parseInt(currentMatch[1], 10);
    const previousDays = parseInt(previousMatch[1], 10);
    if (previousDays > currentDays) {
      warning = `Warning: "${previousPreset}" overlaps with "${currentPreset}". Consider using "previous_${currentDays}d" for non-overlapping comparison.`;
    }
  }

  return {
    current: { preset: currentPreset },
    previous: { preset: previousPreset },
    warning,
  };
}
