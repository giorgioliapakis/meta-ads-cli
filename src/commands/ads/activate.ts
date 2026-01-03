import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Activate extends AuthenticatedCommand {
  static override description = 'Activate an ad';

  static override examples = ['<%= config.bin %> ads activate 120410123456789'];

  static override args = {
    ad_id: Args.string({ description: 'Ad ID', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Activate);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const ad = await this.client.updateAdStatus(args.ad_id, 'ACTIVE');
      this.formatter.success(`Activated ad: ${ad.id}`);
      this.outputSuccess(ad, this.client.getAccountId());
    });
  }
}
