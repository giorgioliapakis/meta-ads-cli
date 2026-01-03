import { Args, Flags } from '@oclif/core';
import { Command } from '@oclif/core';
import { configManager } from '../../lib/config/manager.js';
import { OutputFormatter, createSuccessResponse } from '../../lib/output/formatter.js';

export default class Switch extends Command {
  static override description = 'Set the default ad account';

  static override examples = ['<%= config.bin %> accounts switch act_123456789'];

  static override args = {
    account_id: Args.string({ description: 'Ad account ID (e.g., act_123456789)', required: true }),
  };

  static override flags = {
    output: Flags.string({ char: 'o', description: 'Output format', options: ['json', 'table'], default: 'json' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Switch);
    const formatter = new OutputFormatter({ format: flags.output as 'json' | 'table' });

    configManager.set('account_id', args.account_id);

    const response = createSuccessResponse({
      message: `Default account set to ${args.account_id}`,
      account_id: args.account_id,
    });
    formatter.output(response);
    formatter.success(`Default account set to ${args.account_id}`);
  }
}
