import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Pause extends AuthenticatedCommand {
  static override description = 'Pause an ad';

  static override examples = ['<%= config.bin %> ads pause 120410123456789'];

  static override args = {
    ad_id: Args.string({ description: 'Ad ID', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Pause);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      // Check current status to determine if action is needed
      const current = await this.client.getAd(args.ad_id);
      const alreadyPaused = current.status === 'PAUSED';

      const ad = alreadyPaused
        ? current
        : await this.client.updateAdStatus(args.ad_id, 'PAUSED');

      this.formatter.success(`${alreadyPaused ? 'Already paused' : 'Paused'} ad: ${ad.id}`);
      this.outputMutationSuccess(
        ad,
        this.client.getAccountId(),
        !alreadyPaused,
        alreadyPaused ? 'already_paused' : 'status_changed'
      );
    });
  }
}
