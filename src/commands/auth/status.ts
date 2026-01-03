import { Command, Flags } from '@oclif/core';
import { tokenManager } from '../../lib/auth/token-manager.js';
import { OutputFormatter, createSuccessResponse, createErrorResponse } from '../../lib/output/formatter.js';
import { isCliError } from '../../lib/errors/handler.js';

export default class Status extends Command {
  static override description = 'Show current authentication status';

  static override examples = ['<%= config.bin %> auth status'];

  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output format',
      options: ['json', 'table'],
      default: 'json',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Status);
    const formatter = new OutputFormatter({ format: flags.output as 'json' | 'table' });

    if (!tokenManager.hasToken()) {
      const response = createErrorResponse('AUTH_NOT_CONFIGURED', 'No access token configured. Run `meta-ads auth login` to authenticate.');
      formatter.output(response);
      this.exit(1);
    }

    try {
      const token = await tokenManager.getToken();
      const tokenInfo = await tokenManager.validateToken(token);
      const permCheck = tokenManager.hasRequiredPermissions(tokenInfo);

      const response = createSuccessResponse({
        authenticated: true,
        token_type: tokenInfo.type,
        app_id: tokenInfo.app_id,
        app: tokenInfo.application,
        expires: tokenManager.formatTokenExpiry(tokenInfo),
        scopes: tokenInfo.scopes,
        has_required_permissions: permCheck.valid,
        missing_permissions: permCheck.missing.length > 0 ? permCheck.missing : undefined,
      });

      formatter.output(response);
    } catch (error) {
      if (isCliError(error)) {
        formatter.output(error.toResponse());
        this.exit(1);
      }
      const response = createErrorResponse('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Failed to check status');
      formatter.output(response);
      this.exit(1);
    }
  }
}
