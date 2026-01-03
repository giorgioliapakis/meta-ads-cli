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

export default class Get extends AuthenticatedCommand {
  static override description = 'Get performance insights/metrics';

  static override examples = [
    '<%= config.bin %> insights get --level campaign --date-preset last_7d',
    '<%= config.bin %> insights get --level ad --date-range 2025-01-01:2025-01-31',
    '<%= config.bin %> insights get --level adset --breakdown age,gender',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    level: Flags.string({ description: 'Aggregation level', required: true, options: ['account', 'campaign', 'adset', 'ad'] }),
    'date-preset': Flags.string({ description: 'Date preset', options: DATE_PRESETS }),
    'date-range': Flags.string({ description: 'Date range (YYYY-MM-DD:YYYY-MM-DD)' }),
    breakdowns: Flags.string({ description: 'Comma-separated breakdowns (age, gender, country, etc.)' }),
    fields: Flags.string({ description: 'Comma-separated metrics to include' }),
    limit: Flags.integer({ char: 'l', description: 'Maximum results', default: 25 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
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

      const columns: TableColumn<Insights>[] = [
        { key: 'date_start', header: 'Start' },
        { key: 'date_stop', header: 'End' },
        { key: 'impressions', header: 'Impressions' },
        { key: 'clicks', header: 'Clicks' },
        { key: 'spend', header: 'Spend' },
        { key: 'ctr', header: 'CTR' },
      ];

      this.outputSuccess(insights, this.client.getAccountId(), columns);
    });
  }
}
