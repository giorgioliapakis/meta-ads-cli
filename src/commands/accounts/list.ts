import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { AdAccount } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List all accessible ad accounts';

  static override examples = [
    '<%= config.bin %> accounts list',
    '<%= config.bin %> accounts list --limit 50',
    '<%= config.bin %> accounts list --output table',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', description: 'Maximum number of accounts to return', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(flags, async () => {
      const result = await this.client.listAccounts({ limit: flags.limit, after: flags.after, full: flags.full });

      const columns: TableColumn<AdAccount>[] = [
        { key: 'account_id', header: 'Account ID' },
        { key: 'name', header: 'Name' },
        { key: 'currency', header: 'Currency' },
        { key: 'account_status', header: 'Status', formatter: (v) => v === 1 ? 'Active' : 'Inactive' },
        { key: 'amount_spent', header: 'Spent', formatter: (v) => v ? `${Number(v) / 100}` : '-' },
      ];

      this.outputSuccess(result.data, undefined, columns);
    });
  }
}
