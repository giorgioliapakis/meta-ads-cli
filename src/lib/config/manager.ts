import Conf from 'conf';
import type { Config } from '../../types/index.js';

const ENV_PREFIX = 'META_ADS_';

interface ConfigStoreSchema {
  access_token?: string;
  account_id?: string;
  output_format: 'json' | 'table';
  api_version: string;
  verbose: boolean;
}

const defaults: ConfigStoreSchema = {
  output_format: 'json',
  api_version: 'v22.0',
  verbose: false,
};

// Create store lazily to allow for testing
let store: Conf<ConfigStoreSchema> | null = null;

function getStore(): Conf<ConfigStoreSchema> {
  if (!store) {
    store = new Conf<ConfigStoreSchema>({
      projectName: 'meta-ads',
      defaults,
      schema: {
        access_token: { type: 'string' },
        account_id: { type: 'string' },
        output_format: { type: 'string', enum: ['json', 'table'], default: 'json' },
        api_version: { type: 'string', default: 'v22.0' },
        verbose: { type: 'boolean', default: false },
      },
    });
  }
  return store;
}

function getEnvValue(key: string): string | undefined {
  const envKey = `${ENV_PREFIX}${key.toUpperCase()}`;
  return process.env[envKey];
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value.toLowerCase() === 'true' || value === '1';
}

export interface FlagValues {
  token?: string;
  account?: string;
  output?: string;
  verbose?: boolean;
  quiet?: boolean;
}

export class ConfigManager {
  /**
   * Get the access token with priority: flags > env > config
   */
  getAccessToken(flags?: FlagValues): string | undefined {
    // 1. Command flags
    if (flags?.token) {
      return flags.token;
    }

    // 2. Environment variable
    const envToken = getEnvValue('ACCESS_TOKEN');
    if (envToken) {
      return envToken;
    }

    // 3. Config file
    return getStore().get('access_token');
  }

  /**
   * Get the account ID with priority: flags > env > config
   */
  getAccountId(flags?: FlagValues): string | undefined {
    // 1. Command flags
    if (flags?.account) {
      return flags.account;
    }

    // 2. Environment variable
    const envAccount = getEnvValue('ACCOUNT_ID');
    if (envAccount) {
      return envAccount;
    }

    // 3. Config file
    return getStore().get('account_id');
  }

  /**
   * Get the output format with priority: flags > env > config
   */
  getOutputFormat(flags?: FlagValues): 'json' | 'table' {
    // 1. Command flags
    if (flags?.output === 'json' || flags?.output === 'table') {
      return flags.output;
    }

    // 2. Environment variable
    const envOutput = getEnvValue('OUTPUT');
    if (envOutput === 'json' || envOutput === 'table') {
      return envOutput;
    }

    // 3. Config file
    return getStore().get('output_format');
  }

  /**
   * Get verbose mode with priority: flags > env > config
   */
  getVerbose(flags?: FlagValues): boolean {
    // Quiet overrides verbose
    if (flags?.quiet) {
      return false;
    }

    // 1. Command flags
    if (flags?.verbose !== undefined) {
      return flags.verbose;
    }

    // 2. Environment variable
    const envVerbose = parseBoolean(getEnvValue('VERBOSE'));
    if (envVerbose !== undefined) {
      return envVerbose;
    }

    // 3. Config file
    return getStore().get('verbose');
  }

  /**
   * Get API version with priority: env > config
   */
  getApiVersion(): string {
    const envVersion = getEnvValue('API_VERSION');
    if (envVersion) {
      return envVersion;
    }
    return getStore().get('api_version');
  }

  /**
   * Get all config values
   */
  getAll(flags?: FlagValues): Config {
    return {
      access_token: this.getAccessToken(flags),
      account_id: this.getAccountId(flags),
      output_format: this.getOutputFormat(flags),
      api_version: this.getApiVersion(),
      verbose: this.getVerbose(flags),
    };
  }

  /**
   * Set a config value
   */
  set<K extends keyof ConfigStoreSchema>(key: K, value: ConfigStoreSchema[K]): void {
    getStore().set(key, value);
  }

  /**
   * Get a config value from the file (not considering flags or env)
   */
  get<K extends keyof ConfigStoreSchema>(key: K): ConfigStoreSchema[K] {
    return getStore().get(key);
  }

  /**
   * Delete a config value
   */
  delete<K extends keyof ConfigStoreSchema>(key: K): void {
    getStore().delete(key);
  }

  /**
   * Clear all config
   */
  clear(): void {
    getStore().clear();
  }

  /**
   * Get the config file path
   */
  getPath(): string {
    return getStore().path;
  }

  /**
   * List all config entries
   */
  list(): Record<string, unknown> {
    const config = getStore().store as unknown as Record<string, unknown>;
    // Mask the access token for display
    if (config.access_token && typeof config.access_token === 'string') {
      const token = config.access_token;
      return {
        ...config,
        access_token: token.length > 10
          ? `${token.slice(0, 6)}...${token.slice(-4)}`
          : '***',
      };
    }
    return config;
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
