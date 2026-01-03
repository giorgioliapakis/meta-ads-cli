import { configManager, type FlagValues } from '../config/manager.js';
import { CliError } from '../errors/handler.js';
import { ErrorCode } from '../errors/codes.js';
import type { TokenInfo } from '../../types/index.js';

const META_GRAPH_URL = 'https://graph.facebook.com';

export class TokenManager {
  private apiVersion: string;

  constructor() {
    this.apiVersion = configManager.getApiVersion();
  }

  /**
   * Get the access token, throwing if not configured
   */
  async getToken(flags?: FlagValues): Promise<string> {
    const token = configManager.getAccessToken(flags);

    if (!token) {
      throw new CliError(ErrorCode.AUTH_NOT_CONFIGURED);
    }

    return token;
  }

  /**
   * Validate an access token and return its info
   */
  async validateToken(token: string): Promise<TokenInfo> {
    const url = `${META_GRAPH_URL}/${this.apiVersion}/debug_token?input_token=${token}&access_token=${token}`;

    try {
      const response = await fetch(url);
      const result = await response.json() as {
        data?: TokenInfo;
        error?: { message: string; code: number };
      };

      if (result.error) {
        throw new CliError(
          ErrorCode.AUTH_TOKEN_INVALID,
          result.error.message,
          { code: result.error.code }
        );
      }

      if (!result.data) {
        throw new CliError(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid token response');
      }

      const tokenInfo = result.data;

      if (!tokenInfo.is_valid) {
        throw new CliError(ErrorCode.AUTH_TOKEN_INVALID, 'Token is not valid');
      }

      // Check if token is expired
      if (tokenInfo.expires_at && tokenInfo.expires_at < Date.now() / 1000) {
        throw new CliError(ErrorCode.AUTH_TOKEN_EXPIRED);
      }

      return tokenInfo;
    } catch (error) {
      if (error instanceof CliError) {
        throw error;
      }
      throw new CliError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Failed to validate token'
      );
    }
  }

  /**
   * Save an access token to config
   */
  saveToken(token: string): void {
    configManager.set('access_token', token);
  }

  /**
   * Delete the stored access token
   */
  deleteToken(): void {
    configManager.delete('access_token');
  }

  /**
   * Check if a token is configured
   */
  hasToken(flags?: FlagValues): boolean {
    return !!configManager.getAccessToken(flags);
  }

  /**
   * Get token expiry info formatted for display
   */
  formatTokenExpiry(tokenInfo: TokenInfo): string {
    if (!tokenInfo.expires_at || tokenInfo.expires_at === 0) {
      return 'Never expires (System User token)';
    }

    const expiresAt = new Date(tokenInfo.expires_at * 1000);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''} (${expiresAt.toLocaleDateString()})`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Expires soon';
    }
  }

  /**
   * Get required permissions for the CLI
   */
  getRequiredPermissions(): string[] {
    return ['ads_management', 'ads_read', 'business_management'];
  }

  /**
   * Check if token has required permissions
   */
  hasRequiredPermissions(tokenInfo: TokenInfo): { valid: boolean; missing: string[] } {
    const required = this.getRequiredPermissions();
    const missing = required.filter(perm => !tokenInfo.scopes.includes(perm));
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
