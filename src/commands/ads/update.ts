import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Update extends AuthenticatedCommand {
  static override description = 'Update an ad';

  static override examples = ['<%= config.bin %> ads update 120410123456789 --name "Updated Ad"'];

  static override args = {
    ad_id: Args.string({ description: 'Ad ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Ad name' }),
    status: Flags.string({ description: 'Status', options: ['ACTIVE', 'PAUSED'] }),
    'creative-id': Flags.string({ description: 'Creative ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const params: Record<string, unknown> = {};
      if (flags.name) params.name = flags.name;
      if (flags.status) params.status = flags.status;
      if (flags['creative-id']) params.creative = { creative_id: flags['creative-id'] };

      const ad = await this.client.updateAd(args.ad_id, params);

      this.formatter.success(`Updated ad: ${ad.id}`);
      this.outputSuccess(ad, this.client.getAccountId());
    });
  }
}
