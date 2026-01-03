import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Create extends AuthenticatedCommand {
  static override description = 'Create a new ad';

  static override examples = [
    '<%= config.bin %> ads create --adset 123 --name "Ad 1" --creative-id 456',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    adset: Flags.string({ description: 'Ad set ID', required: true }),
    name: Flags.string({ char: 'n', description: 'Ad name', required: true }),
    'creative-id': Flags.string({ description: 'Creative ID to use', required: true }),
    status: Flags.string({ description: 'Initial status', options: ['ACTIVE', 'PAUSED'], default: 'PAUSED' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const ad = await this.client.createAd({
        adset_id: flags.adset,
        name: flags.name,
        creative: { creative_id: flags['creative-id'] },
        status: flags.status,
      });

      this.formatter.success(`Created ad: ${ad.id}`);
      this.outputSuccess(ad, this.client.getAccountId());
    });
  }
}
