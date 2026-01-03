import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Activate extends AuthenticatedCommand {
  static override description = 'Activate a campaign';

  static override examples = ['<%= config.bin %> campaigns activate 120210123456789'];

  static override args = {
    campaign_id: Args.string({ description: 'Campaign ID', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Activate);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const campaign = await this.client.updateCampaignStatus(args.campaign_id, 'ACTIVE');
      this.formatter.success(`Activated campaign: ${campaign.id}`);
      this.outputSuccess(campaign, this.client.getAccountId());
    });
  }
}
