import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { AdVideo } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List ad videos';

  static override examples = ['<%= config.bin %> advideos list'];

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', description: 'Maximum number of videos', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listVideos({ limit: flags.limit, after: flags.after });

      const columns: TableColumn<AdVideo>[] = [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title' },
        { key: 'length', header: 'Length (s)' },
        { key: 'created_time', header: 'Created' },
      ];

      this.outputSuccess(result.data, this.client.getAccountId(), columns);
    });
  }
}
