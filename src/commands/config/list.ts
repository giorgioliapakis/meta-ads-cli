import { Command, Flags } from '@oclif/core';
import { configManager } from '../../lib/config/manager.js';
import { OutputFormatter, createSuccessResponse } from '../../lib/output/formatter.js';

export default class List extends Command {
  static override description = 'List all configuration values';

  static override examples = ['<%= config.bin %> config list'];

  static override flags = {
    output: Flags.string({ char: 'o', description: 'Output format', options: ['json', 'table'], default: 'json' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(List);
    const formatter = new OutputFormatter({ format: flags.output as 'json' | 'table' });

    const config = configManager.list();
    const response = createSuccessResponse({ config, path: configManager.getPath() });
    formatter.output(response);
  }
}
