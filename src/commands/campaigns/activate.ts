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
      // Check current status to determine if action is needed
      const current = await this.client.getCampaign(args.campaign_id);
      const alreadyActive = current.status === 'ACTIVE';

      const campaign = alreadyActive
        ? current
        : await this.client.updateCampaignStatus(args.campaign_id, 'ACTIVE');

      this.formatter.success(`${alreadyActive ? 'Already active' : 'Activated'} campaign: ${campaign.id}`);
      this.outputMutationSuccess(
        campaign,
        this.client.getAccountId(),
        !alreadyActive,
        alreadyActive ? 'already_active' : 'status_changed'
      );
    });
  }
}
