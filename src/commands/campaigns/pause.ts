import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Pause extends AuthenticatedCommand {
  static override description = 'Pause a campaign';

  static override examples = ['<%= config.bin %> campaigns pause 120210123456789'];

  static override args = {
    campaign_id: Args.string({ description: 'Campaign ID', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Pause);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const campaign = await this.client.updateCampaignStatus(args.campaign_id, 'PAUSED');
      this.formatter.success(`Paused campaign: ${campaign.id}`);
      this.outputSuccess(campaign, this.client.getAccountId());
    });
  }
}
