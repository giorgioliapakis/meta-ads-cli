import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Get extends AuthenticatedCommand {
  static override description = 'Get ad set details';

  static override examples = ['<%= config.bin %> adsets get 120310123456789'];

  static override args = {
    adset_id: Args.string({ description: 'Ad set ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const adset = await this.client.getAdSet(args.adset_id, flags.fields?.split(','));
      this.outputSuccess(adset, this.client.getAccountId());
    });
  }
}
