import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Pause extends AuthenticatedCommand {
  static override description = 'Pause an ad set';

  static override examples = ['<%= config.bin %> adsets pause 120310123456789'];

  static override args = {
    adset_id: Args.string({ description: 'Ad set ID', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Pause);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const adset = await this.client.updateAdSetStatus(args.adset_id, 'PAUSED');
      this.formatter.success(`Paused ad set: ${adset.id}`);
      this.outputSuccess(adset, this.client.getAccountId());
    });
  }
}
