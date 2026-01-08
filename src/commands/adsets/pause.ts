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
      // Check current status to determine if action is needed
      const current = await this.client.getAdSet(args.adset_id);
      const alreadyPaused = current.status === 'PAUSED';

      const adset = alreadyPaused
        ? current
        : await this.client.updateAdSetStatus(args.adset_id, 'PAUSED');

      this.formatter.success(`${alreadyPaused ? 'Already paused' : 'Paused'} ad set: ${adset.id}`);
      this.outputMutationSuccess(
        adset,
        this.client.getAccountId(),
        !alreadyPaused,
        alreadyPaused ? 'already_paused' : 'status_changed'
      );
    });
  }
}
