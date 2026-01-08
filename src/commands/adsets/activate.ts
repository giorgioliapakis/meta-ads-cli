import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Activate extends AuthenticatedCommand {
  static override description = 'Activate an ad set';

  static override examples = ['<%= config.bin %> adsets activate 120310123456789'];

  static override args = {
    adset_id: Args.string({ description: 'Ad set ID', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Activate);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      // Check current status to determine if action is needed
      const current = await this.client.getAdSet(args.adset_id);
      const alreadyActive = current.status === 'ACTIVE';

      const adset = alreadyActive
        ? current
        : await this.client.updateAdSetStatus(args.adset_id, 'ACTIVE');

      this.formatter.success(`${alreadyActive ? 'Already active' : 'Activated'} ad set: ${adset.id}`);
      this.outputMutationSuccess(
        adset,
        this.client.getAccountId(),
        !alreadyActive,
        alreadyActive ? 'already_active' : 'status_changed'
      );
    });
  }
}
