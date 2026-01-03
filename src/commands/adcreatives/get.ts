import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Get extends AuthenticatedCommand {
  static override description = 'Get creative details';

  static override examples = ['<%= config.bin %> creatives get 120510123456789'];

  static override args = {
    creative_id: Args.string({ description: 'Creative ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const creative = await this.client.getCreative(args.creative_id, flags.fields?.split(','));
      this.outputSuccess(creative, this.client.getAccountId());
    });
  }
}
