import { Args } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Get extends AuthenticatedCommand {
  static override description = 'Get details of an ad account';

  static override examples = ['<%= config.bin %> accounts get act_123456789'];

  static override args = {
    account_id: Args.string({ description: 'Ad account ID (e.g., act_123456789)', required: true }),
  };

  static override flags = { ...BaseCommand.baseFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(flags, async () => {
      const account = await this.client.getAccount(args.account_id);
      this.outputSuccess(account, args.account_id);
    });
  }
}
