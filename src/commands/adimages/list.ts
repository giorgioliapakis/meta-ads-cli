import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { AdImage } from '../../types/index.js';
import type { TableColumn } from '../../lib/output/formatter.js';

export default class List extends AuthenticatedCommand {
  static override description = 'List ad images';

  static override examples = ['<%= config.bin %> adimages list'];

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', description: 'Maximum number of images', default: 25 }),
    after: Flags.string({ description: 'Pagination cursor' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const result = await this.client.listImages({ limit: flags.limit, after: flags.after });

      const columns: TableColumn<AdImage>[] = [
        { key: 'hash', header: 'Hash' },
        { key: 'name', header: 'Name' },
        { key: 'width', header: 'Width' },
        { key: 'height', header: 'Height' },
      ];

      this.outputSuccess(result.data, this.client.getAccountId(), columns);
    });
  }
}
