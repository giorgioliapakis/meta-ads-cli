import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { AdSet } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List ad sets';

  static override examples = [
    '<%= config.bin %> adsets list',
    '<%= config.bin %> adsets list --campaign 120210123456789',
    '<%= config.bin %> adsets list --status ACTIVE',
    '<%= config.bin %> adsets list --all',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    campaign: Flags.string({ char: 'c', description: 'Filter by campaign ID' }),
    status: Flags.string({ char: 's', description: 'Filter by status', options: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] }),
    limit: Flags.integer({ char: 'l', description: 'Maximum number of ad sets', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
    all: Flags.boolean({ description: 'Fetch all pages automatically (ignores limit)', default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listAdSets({
        campaignId: flags.campaign,
        status: flags.status,
        limit: flags.all ? 100 : flags.limit,
        after: flags.after,
        all: flags.all,
      });

      const columns: TableColumn<AdSet>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
        { key: 'daily_budget', header: 'Daily Budget', formatter: (v) => v ? `${Number(v) / 100}` : '-' },
        { key: 'optimization_goal', header: 'Optimization' },
      ];

      this.outputSuccess(result.data, this.client.getAccountId(), columns);
    });
  }
}
