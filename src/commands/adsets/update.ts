import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Update extends AuthenticatedCommand {
  static override description = 'Update an ad set';

  static override examples = ['<%= config.bin %> adsets update 120310123456789 --name "Updated Name"'];

  static override args = {
    adset_id: Args.string({ description: 'Ad set ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Ad set name' }),
    status: Flags.string({ description: 'Status', options: ['ACTIVE', 'PAUSED'] }),
    'daily-budget': Flags.integer({ description: 'Daily budget in cents' }),
    'lifetime-budget': Flags.integer({ description: 'Lifetime budget in cents' }),
    targeting: Flags.string({ description: 'Targeting spec as JSON' }),
    'bid-amount': Flags.integer({ description: 'Bid amount in cents' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const params: Record<string, unknown> = {};
      if (flags.name) params.name = flags.name;
      if (flags.status) params.status = flags.status;
      if (flags['daily-budget']) params.daily_budget = flags['daily-budget'].toString();
      if (flags['lifetime-budget']) params.lifetime_budget = flags['lifetime-budget'].toString();
      if (flags.targeting) params.targeting = JSON.parse(flags.targeting);
      if (flags['bid-amount']) params.bid_amount = flags['bid-amount'].toString();

      const adset = await this.client.updateAdSet(args.adset_id, params);

      this.formatter.success(`Updated ad set: ${adset.id}`);
      this.outputSuccess(adset, this.client.getAccountId());
    });
  }
}
