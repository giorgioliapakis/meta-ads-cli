import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Create extends AuthenticatedCommand {
  static override description = 'Create a new ad set';

  static override examples = [
    '<%= config.bin %> adsets create --campaign 123 --name "US 25-45" --billing-event IMPRESSIONS --optimization-goal REACH --targeting \'{"geo_locations":{"countries":["US"]}}\'',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    campaign: Flags.string({ char: 'c', description: 'Campaign ID', required: true }),
    name: Flags.string({ char: 'n', description: 'Ad set name', required: true }),
    'billing-event': Flags.string({ description: 'Billing event', required: true, options: ['IMPRESSIONS', 'LINK_CLICKS', 'APP_INSTALLS', 'PAGE_LIKES'] }),
    'optimization-goal': Flags.string({ description: 'Optimization goal', required: true }),
    targeting: Flags.string({ description: 'Targeting spec as JSON', required: true }),
    status: Flags.string({ description: 'Initial status', options: ['ACTIVE', 'PAUSED'], default: 'PAUSED' }),
    'daily-budget': Flags.integer({ description: 'Daily budget in cents' }),
    'lifetime-budget': Flags.integer({ description: 'Lifetime budget in cents' }),
    'start-time': Flags.string({ description: 'Start time (ISO 8601)' }),
    'end-time': Flags.string({ description: 'End time (ISO 8601)' }),
    'bid-amount': Flags.integer({ description: 'Bid amount in cents' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const targeting = JSON.parse(flags.targeting);

      const adset = await this.client.createAdSet({
        campaign_id: flags.campaign,
        name: flags.name,
        billing_event: flags['billing-event'],
        optimization_goal: flags['optimization-goal'],
        targeting,
        status: flags.status,
        daily_budget: flags['daily-budget']?.toString(),
        lifetime_budget: flags['lifetime-budget']?.toString(),
        start_time: flags['start-time'],
        end_time: flags['end-time'],
        bid_amount: flags['bid-amount']?.toString(),
      });

      this.formatter.success(`Created ad set: ${adset.id}`);
      this.outputSuccess(adset, this.client.getAccountId());
    });
  }
}
