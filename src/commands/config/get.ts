import { Command, Args, Flags } from '@oclif/core';
import { configManager } from '../../lib/config/manager.js';
import { OutputFormatter, createSuccessResponse } from '../../lib/output/formatter.js';

export default class Get extends Command {
  static override description = 'Get a configuration value';

  static override examples = ['<%= config.bin %> config get account_id'];

  static override args = {
    key: Args.string({ description: 'Configuration key', required: true }),
  };

  static override flags = {
    output: Flags.string({ char: 'o', description: 'Output format', options: ['json', 'table'], default: 'json' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);
    const formatter = new OutputFormatter({ format: flags.output as 'json' | 'table' });

    const value = configManager.get(args.key as 'account_id' | 'output_format' | 'api_version' | 'verbose');
    const response = createSuccessResponse({ key: args.key, value: value ?? null });
    formatter.output(response);
  }
}
