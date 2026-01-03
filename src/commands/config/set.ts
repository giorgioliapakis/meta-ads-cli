import { Command, Args, Flags } from '@oclif/core';
import { configManager } from '../../lib/config/manager.js';
import { OutputFormatter, createSuccessResponse, createErrorResponse } from '../../lib/output/formatter.js';

const VALID_KEYS = ['account_id', 'output_format', 'api_version', 'verbose'] as const;
type ValidKey = typeof VALID_KEYS[number];

export default class Set extends Command {
  static override description = 'Set a configuration value';

  static override examples = [
    '<%= config.bin %> config set account_id act_123456789',
    '<%= config.bin %> config set output_format table',
  ];

  static override args = {
    key: Args.string({ description: 'Configuration key', required: true, options: [...VALID_KEYS] }),
    value: Args.string({ description: 'Configuration value', required: true }),
  };

  static override flags = {
    output: Flags.string({ char: 'o', description: 'Output format', options: ['json', 'table'], default: 'json' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Set);
    const formatter = new OutputFormatter({ format: flags.output as 'json' | 'table' });

    const key = args.key as ValidKey;

    if (!VALID_KEYS.includes(key)) {
      const response = createErrorResponse('INVALID_PARAMETER', `Invalid config key: ${key}. Valid keys: ${VALID_KEYS.join(', ')}`);
      formatter.output(response);
      this.exit(1);
    }

    let value: string | boolean = args.value;
    if (key === 'verbose') {
      value = args.value.toLowerCase() === 'true';
    }

    configManager.set(key, value as never);

    const response = createSuccessResponse({ key, value, message: `Set ${key} to ${value}` });
    formatter.output(response);
  }
}
