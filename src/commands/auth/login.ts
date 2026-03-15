import { Command, Flags } from '@oclif/core';
import { tokenManager } from '../../lib/auth/token-manager.js';
import { OutputFormatter, createSuccessResponse, createErrorResponse } from '../../lib/output/formatter.js';
import { isCliError } from '../../lib/errors/handler.js';
import { getExitCode, ErrorCode } from '../../lib/errors/codes.js';

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
      this.exit(getExitCode(ErrorCode.AUTH_NOT_CONFIGURED));
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
        this.exit(getExitCode(error.code));
      }
      const response = createErrorResponse('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Failed to validate token');
      formatter.output(response);
      this.exit(1);
    }
  }

  private async promptForToken(): Promise<string> {
    console.error('\nTo get an access token:');
    console.error('1. Go to Meta Business Suite > Business Settings');
    console.error('2. Navigate to Users > System Users');
    console.error('3. Generate a token with ads_management and ads_read permissions\n');
    return new Promise((resolve) => {
      process.stdout.write('Enter your access token: ');
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      let input = '';
      const onData = (ch: string) => {
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          stdin.setRawMode(wasRaw ?? false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input.trim());
        } else if (ch === '\u0003') {
          process.exit(130);
        } else if (ch === '\u007f' || ch === '\b') {
          input = input.slice(0, -1);
        } else {
          input += ch;
        }
      };
      stdin.on('data', onData);
    });
  }
}
