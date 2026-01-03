import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Update extends AuthenticatedCommand {
  static override description = 'Update a campaign';

  static override examples = [
    '<%= config.bin %> campaigns update 120210123456789 --name "Updated Name"',
    '<%= config.bin %> campaigns update 120210123456789 --daily-budget 10000',
  ];

  static override args = {
    campaign_id: Args.string({ description: 'Campaign ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Campaign name' }),
    status: Flags.string({ description: 'Campaign status', options: ['ACTIVE', 'PAUSED'] }),
    'daily-budget': Flags.integer({ description: 'Daily budget in cents' }),
    'lifetime-budget': Flags.integer({ description: 'Lifetime budget in cents' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const params: Record<string, unknown> = {};
      if (flags.name) params.name = flags.name;
      if (flags.status) params.status = flags.status;
      if (flags['daily-budget']) params.daily_budget = flags['daily-budget'].toString();
      if (flags['lifetime-budget']) params.lifetime_budget = flags['lifetime-budget'].toString();

      const campaign = await this.client.updateCampaign(args.campaign_id, params);

      this.formatter.success(`Updated campaign: ${campaign.id}`);
      this.outputSuccess(campaign, this.client.getAccountId());
    });
  }
}
