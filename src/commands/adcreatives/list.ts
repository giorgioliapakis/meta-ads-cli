import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { AdCreative } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List ad creatives';

  static override examples = ['<%= config.bin %> creatives list', '<%= config.bin %> creatives list --limit 50'];

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', description: 'Maximum number of creatives', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listCreatives({ limit: flags.limit, after: flags.after, full: flags.full });

      const columns: TableColumn<AdCreative>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'title', header: 'Title' },
        { key: 'call_to_action_type', header: 'CTA' },
      ];

      this.outputSuccess(result.data, this.client.getAccountId(), columns);
    });
  }
}
