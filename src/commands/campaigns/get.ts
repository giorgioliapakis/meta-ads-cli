import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Get extends AuthenticatedCommand {
  static override description = 'Get campaign details';

  static override examples = ['<%= config.bin %> campaigns get 120210123456789'];

  static override args = {
    campaign_id: Args.string({ description: 'Campaign ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const campaign = await this.client.getCampaign(args.campaign_id, flags.fields?.split(','));
      this.outputSuccess(campaign, this.client.getAccountId());
    });
  }
}
