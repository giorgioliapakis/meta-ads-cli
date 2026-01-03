import { Command, Flags } from '@oclif/core';
import { tokenManager } from '../../lib/auth/token-manager.js';
import { OutputFormatter, createSuccessResponse } from '../../lib/output/formatter.js';

export default class Logout extends Command {
  static override description = 'Remove stored access token';

  static override examples = ['<%= config.bin %> auth logout'];

  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output format',
      options: ['json', 'table'],
      default: 'json',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Logout);
    const formatter = new OutputFormatter({ format: flags.output as 'json' | 'table' });

    tokenManager.deleteToken();

    const response = createSuccessResponse({ message: 'Successfully logged out' });
    formatter.output(response);
    formatter.success('Access token removed from config');
  }
}
