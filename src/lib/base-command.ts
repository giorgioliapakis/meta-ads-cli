import { Command, Flags } from '@oclif/core';
import { type FlagValues } from './config/manager.js';
import { MetaAdsClient } from './api/client.js';
import { OutputFormatter, createSuccessResponse, createErrorResponse, type TableColumn } from './output/formatter.js';
import { CliError, isCliError } from './errors/handler.js';

/**
 * Base command with common flags and utilities
 */
export abstract class BaseCommand extends Command {
  static baseFlags = {
    account: Flags.string({
      char: 'a',
      description: 'Ad account ID (e.g., act_123456789)',
      env: 'META_ADS_ACCOUNT_ID',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output format',
      options: ['json', 'table'],
      default: 'json',
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output',
      default: false,
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'Suppress non-essential output',
      default: false,
    }),
    'output-fields': Flags.string({
      description: 'Filter output to specific fields (comma-separated, e.g., id,name,spend)',
    }),
  };

  protected formatter!: OutputFormatter;
  protected client!: MetaAdsClient;
  protected outputFieldsFilter?: string[];

  /**
   * Initialize the formatter with parsed flags
   */
  protected initFormatter(flags: { output?: string; verbose?: boolean; quiet?: boolean; 'output-fields'?: string }): void {
    this.formatter = new OutputFormatter({
      format: (flags.output as 'json' | 'table') ?? 'json',
      verbose: flags.verbose,
      quiet: flags.quiet,
    });
    if (flags['output-fields']) {
      this.outputFieldsFilter = flags['output-fields'].split(',').map((f) => f.trim());
    }
  }

  /**
   * Filter object to only include specified fields
   */
  private filterFields<T>(data: T): T {
    if (!this.outputFieldsFilter) return data;

    const filter = (obj: Record<string, unknown>): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const field of this.outputFieldsFilter!) {
        if (field in obj) {
          result[field] = obj[field];
        }
      }
      return result;
    };

    if (Array.isArray(data)) {
      return data.map((item) => filter(item as Record<string, unknown>)) as T;
    }
    return filter(data as Record<string, unknown>) as T;
  }

  /**
   * Initialize the API client with parsed flags
   */
  protected async initClient(flags: FlagValues): Promise<void> {
    this.client = await MetaAdsClient.fromConfig(flags);
  }

  /**
   * Get flags as FlagValues type
   */
  protected toFlagValues(flags: {
    account?: string;
    output?: string;
    verbose?: boolean;
    quiet?: boolean;
    token?: string;
    'output-fields'?: string;
  }): FlagValues & { 'output-fields'?: string } {
    return {
      account: flags.account,
      output: flags.output,
      verbose: flags.verbose,
      quiet: flags.quiet,
      token: flags.token,
      'output-fields': flags['output-fields'],
    };
  }

  /**
   * Output a success response
   */
  protected outputSuccess<T>(data: T, accountId?: string, columns?: TableColumn<T extends Array<infer U> ? U : T>[]): void {
    const filteredData = this.filterFields(data);
    const response = createSuccessResponse(filteredData, accountId);
    this.formatter.output(response, columns as TableColumn<T>[]);
  }

  /**
   * Output an error and exit
   */
  protected outputError(error: CliError | Error | unknown): never {
    if (isCliError(error)) {
      const response = error.toResponse();
      this.formatter.output(response);
      this.exit(1);
    }

    // Handle non-CliError errors
    const message = error instanceof Error ? error.message : String(error);
    const response = createErrorResponse('UNKNOWN_ERROR', message);
    this.formatter.output(response);
    this.exit(1);
  }

  /**
   * Handle any error and output appropriately
   */
  protected handleError(error: unknown): never {
    this.outputError(error);
  }
}

/**
 * Base command for commands that require authentication
 */
export abstract class AuthenticatedCommand extends BaseCommand {
  async init(): Promise<void> {
    await super.init();
  }

  /**
   * Run with authentication and error handling
   */
  protected async runWithAuth<T>(
    flags: FlagValues & { output?: string; verbose?: boolean; quiet?: boolean; 'output-fields'?: string },
    fn: () => Promise<T>
  ): Promise<void> {
    try {
      this.initFormatter(flags);
      await this.initClient(flags);
      await fn();
    } catch (error) {
      this.handleError(error);
    }
  }
}
