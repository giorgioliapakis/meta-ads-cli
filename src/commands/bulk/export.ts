import { Flags } from '@oclif/core';
import { writeFile } from 'node:fs/promises';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Export extends AuthenticatedCommand {
  static override description = 'Export entities to a file';

  static override examples = [
    '<%= config.bin %> bulk export --type campaigns --output campaigns.json',
    '<%= config.bin %> bulk export --type ads --status ACTIVE --output active-ads.json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'Entity type', required: true, options: ['campaigns', 'adsets', 'ads'] }),
    status: Flags.string({ description: 'Filter by status', options: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] }),
    'output-file': Flags.string({ char: 'f', description: 'Output file path', required: true }),
    limit: Flags.integer({ char: 'l', description: 'Maximum entities to export', default: 100 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Export);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      let data: unknown[];

      if (flags.type === 'campaigns') {
        const result = await this.client.listCampaigns({ status: flags.status, limit: flags.limit });
        data = result.data;
      } else if (flags.type === 'adsets') {
        const result = await this.client.listAdSets({ status: flags.status, limit: flags.limit });
        data = result.data;
      } else {
        const result = await this.client.listAds({ status: flags.status, limit: flags.limit });
        data = result.data;
      }

      const output = JSON.stringify({ data, exported_at: new Date().toISOString(), count: data.length }, null, 2);
      await writeFile(flags['output-file'], output);

      this.formatter.success(`Exported ${data.length} ${flags.type} to ${flags['output-file']}`);
      this.outputSuccess({ file: flags['output-file'], count: data.length }, this.client.getAccountId());
    });
  }
}
