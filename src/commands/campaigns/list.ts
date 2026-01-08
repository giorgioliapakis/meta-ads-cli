import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Campaign } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List campaigns';

  static override examples = [
    '<%= config.bin %> campaigns list',
    '<%= config.bin %> campaigns list --status ACTIVE',
    '<%= config.bin %> campaigns list --limit 50 --output table',
    '<%= config.bin %> campaigns list --all',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    status: Flags.string({ char: 's', description: 'Filter by status', options: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] }),
    limit: Flags.integer({ char: 'l', description: 'Maximum number of campaigns', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
    all: Flags.boolean({ description: 'Fetch all pages automatically (ignores limit)', default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listCampaigns({
        status: flags.status,
        limit: flags.all ? 100 : flags.limit, // Use larger page size for --all
        after: flags.after,
        fields: flags.fields?.split(','),
        all: flags.all,
        full: flags.full,
      });

      const columns: TableColumn<Campaign>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
        { key: 'objective', header: 'Objective' },
        { key: 'daily_budget', header: 'Daily Budget', formatter: (v) => v ? `${Number(v) / 100}` : '-' },
      ];

      this.outputSuccess(result.data, this.client.getAccountId(), columns);
    });
  }
}
