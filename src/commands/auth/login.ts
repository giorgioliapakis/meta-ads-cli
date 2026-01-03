import { Command, Flags } from '@oclif/core';
import { createInterface } from 'node:readline';
import { tokenManager } from '../../lib/auth/token-manager.js';
import { OutputFormatter, createSuccessResponse, createErrorResponse } from '../../lib/output/formatter.js';
import { isCliError } from '../../lib/errors/handler.js';

export default class Login extends Command {
  static override description = 'Authenticate with Meta Ads API using an access token';

  static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --token EAAxxxxxx',
  ];

  static override flags = {
    token: Flags.string({
      char: 't',
      description: 'Access token to use (skips interactive prompt)',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output format',
      options: ['json', 'table'],
      default: 'json',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Login);
    const formatter = new OutputFormatter({
      format: flags.output as 'json' | 'table',
    });

    let token = flags.token;

    if (!token) {
      token = await this.promptForToken();
    }

    if (!token) {
      const response = createErrorResponse('AUTH_NOT_CONFIGURED', 'No access token provided.');
      formatter.output(response);
      this.exit(1);
    }

    try {
      formatter.info('Validating token...');
      const tokenInfo = await tokenManager.validateToken(token);

      const permCheck = tokenManager.hasRequiredPermissions(tokenInfo);
      if (!permCheck.valid) {
        formatter.warn(`Token is missing recommended permissions: ${permCheck.missing.join(', ')}`);
      }

      tokenManager.saveToken(token);

      const response = createSuccessResponse({
        message: 'Successfully authenticated',
        token_type: tokenInfo.type,
        app: tokenInfo.application,
        expires: tokenManager.formatTokenExpiry(tokenInfo),
        scopes: tokenInfo.scopes,
      });

      formatter.output(response);
      formatter.success('Token saved to config');
    } catch (error) {
      if (isCliError(error)) {
        formatter.output(error.toResponse());
        this.exit(1);
      }
      const response = createErrorResponse('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Failed to validate token');
      formatter.output(response);
      this.exit(1);
    }
  }

  private async promptForToken(): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      console.log('\nTo get an access token:');
      console.log('1. Go to Meta Business Suite > Business Settings');
      console.log('2. Navigate to Users > System Users');
      console.log('3. Generate a token with ads_management and ads_read permissions\n');
      rl.question('Enter your access token: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}
