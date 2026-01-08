import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Get extends AuthenticatedCommand {
  static override description = 'Get ad details';

  static override examples = ['<%= config.bin %> ads get 120410123456789'];

  static override args = {
    ad_id: Args.string({ description: 'Ad ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const ad = await this.client.getAd(args.ad_id, {
        fields: flags.fields?.split(','),
        full: flags.full,
      });
      this.outputSuccess(ad, this.client.getAccountId());
    });
  }
}
