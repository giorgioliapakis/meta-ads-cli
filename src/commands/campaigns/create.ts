import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

const OBJECTIVES = [
  'OUTCOME_AWARENESS', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS',
  'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_APP_PROMOTION',
];

export default class Create extends AuthenticatedCommand {
  static override description = 'Create a new campaign';

  static override examples = [
    '<%= config.bin %> campaigns create --name "Q1 Brand" --objective OUTCOME_AWARENESS',
    '<%= config.bin %> campaigns create --name "Sales" --objective OUTCOME_SALES --daily-budget 5000',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Campaign name', required: true }),
    objective: Flags.string({ description: 'Campaign objective', required: true, options: OBJECTIVES }),
    status: Flags.string({ description: 'Initial status', options: ['ACTIVE', 'PAUSED'], default: 'PAUSED' }),
    'daily-budget': Flags.integer({ description: 'Daily budget in cents' }),
    'lifetime-budget': Flags.integer({ description: 'Lifetime budget in cents' }),
    'special-ad-categories': Flags.string({ description: 'Comma-separated special ad categories' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const campaign = await this.client.createCampaign({
        name: flags.name,
        objective: flags.objective,
        status: flags.status,
        daily_budget: flags['daily-budget']?.toString(),
        lifetime_budget: flags['lifetime-budget']?.toString(),
        special_ad_categories: flags['special-ad-categories']?.split(','),
      });

      this.formatter.success(`Created campaign: ${campaign.id}`);
      this.outputSuccess(campaign, this.client.getAccountId());
    });
  }
}
