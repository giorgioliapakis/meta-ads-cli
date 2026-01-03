import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Ad } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List ads';

  static override examples = [
    '<%= config.bin %> ads list',
    '<%= config.bin %> ads list --adset 120310123456789',
    '<%= config.bin %> ads list --campaign 120210123456789',
    '<%= config.bin %> ads list --status ACTIVE',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    campaign: Flags.string({ char: 'c', description: 'Filter by campaign ID' }),
    adset: Flags.string({ description: 'Filter by ad set ID' }),
    status: Flags.string({ char: 's', description: 'Filter by status', options: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] }),
    limit: Flags.integer({ char: 'l', description: 'Maximum number of ads', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listAds({
        campaignId: flags.campaign,
        adsetId: flags.adset,
        status: flags.status,
        limit: flags.limit,
        after: flags.after,
      });

      const columns: TableColumn<Ad>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
        { key: 'effective_status', header: 'Effective' },
        { key: 'adset_id', header: 'Ad Set ID' },
      ];

      this.outputSuccess(result.data, this.client.getAccountId(), columns);
    });
  }
}
