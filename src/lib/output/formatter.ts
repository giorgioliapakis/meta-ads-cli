import chalk from 'chalk';
import Table from 'cli-table3';
import type { ApiResponse, SuccessResponse, ErrorResponse } from '../../types/index.js';

export type OutputFormat = 'json' | 'table';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  formatter?: (value: unknown, row: T) => string;
}

export interface FormatterOptions {
  format: OutputFormat;
  verbose?: boolean;
  quiet?: boolean;
}

export class OutputFormatter {
  private options: FormatterOptions;

  constructor(options: FormatterOptions) {
    this.options = options;
  }

  /**
   * Output an API response in the configured format
   */
  output<T>(response: ApiResponse<T>, columns?: TableColumn<T>[]): void {
    if (this.options.format === 'json') {
      this.outputJson(response);
    } else {
      this.outputTable(response, columns);
    }
  }

  /**
   * Output data as JSON
   */
  private outputJson<T>(response: ApiResponse<T>): void {
    const output = JSON.stringify(response, null, 2);
    console.log(output);
  }

  /**
   * Output data as a table
   */
  private outputTable<T>(response: ApiResponse<T>, columns?: TableColumn<T>[]): void {
    if (!response.success) {
      this.outputError(response);
      return;
    }

    const data = response.data;

    if (data === null || data === undefined) {
      console.log(chalk.yellow('No data to display.'));
      return;
    }

    // Handle array data
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      if (columns) {
        this.renderTable(data, columns);
      } else {
        // Auto-generate columns from first item
        const autoColumns = this.autoGenerateColumns(data[0] as Record<string, unknown>);
        this.renderTable(data, autoColumns as TableColumn<T>[]);
      }
      return;
    }

    // Handle single object
    if (typeof data === 'object') {
      if (columns) {
        this.renderTable([data], columns);
      } else {
        this.renderKeyValue(data as Record<string, unknown>);
      }
      return;
    }

    // Handle primitives
    console.log(String(data));
  }

  /**
   * Render a table from data
   */
  private renderTable<T>(data: T[], columns: TableColumn<T>[]): void {
    const colWidths = columns.map(col => col.width).filter((w): w is number => w !== undefined);
    const table = new Table({
      head: columns.map(col => chalk.bold.cyan(col.header)),
      ...(colWidths.length === columns.length ? { colWidths } : {}),
      wordWrap: true,
      style: {
        head: [],
        border: [],
      },
    });

    for (const row of data) {
      const values = columns.map(col => {
        const value = this.getNestedValue(row as Record<string, unknown>, col.key as string);
        if (col.formatter) {
          return col.formatter(value, row);
        }
        return this.formatValue(value);
      });
      table.push(values);
    }

    console.log(table.toString());
  }

  /**
   * Render key-value pairs for a single object
   */
  private renderKeyValue(data: Record<string, unknown>): void {
    const table = new Table({
      style: {
        head: [],
        border: [],
      },
    });

    for (const [key, value] of Object.entries(data)) {
      table.push([chalk.bold(key), this.formatValue(value)]);
    }

    console.log(table.toString());
  }

  /**
   * Output an error response
   */
  private outputError(response: ErrorResponse): void {
    const error = response.error;
    console.error(chalk.red.bold(`Error: ${error.code}`));
    console.error(chalk.red(error.message));

    if (error.details?.suggestion) {
      console.error(chalk.yellow(`\nSuggestion: ${error.details.suggestion}`));
    }

    if (error.retry_after) {
      console.error(chalk.yellow(`\nRetry after: ${error.retry_after} seconds`));
    }

    if (this.options.verbose && error.details) {
      const { suggestion, ...rest } = error.details;
      if (Object.keys(rest).length > 0) {
        console.error(chalk.dim('\nDetails:'));
        console.error(chalk.dim(JSON.stringify(rest, null, 2)));
      }
    }
  }

  /**
   * Output a success message
   */
  success(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.green('✓ ' + message));
    }
  }

  /**
   * Output an info message
   */
  info(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.blue('ℹ ' + message));
    }
  }

  /**
   * Output a warning message
   */
  warn(message: string): void {
    console.warn(chalk.yellow('⚠ ' + message));
  }

  /**
   * Output a verbose/debug message
   */
  debug(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.dim(`[debug] ${message}`));
    }
  }

  /**
   * Format a value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return chalk.dim('-');
    }

    if (typeof value === 'boolean') {
      return value ? chalk.green('Yes') : chalk.red('No');
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    }

    // Format status values with colors
    const stringValue = String(value);
    if (stringValue === 'ACTIVE') {
      return chalk.green(stringValue);
    }
    if (stringValue === 'PAUSED') {
      return chalk.yellow(stringValue);
    }
    if (stringValue === 'DELETED' || stringValue === 'ARCHIVED') {
      return chalk.red(stringValue);
    }

    return stringValue;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Auto-generate columns from an object
   */
  private autoGenerateColumns(obj: Record<string, unknown>): TableColumn<Record<string, unknown>>[] {
    const priorityKeys = ['id', 'name', 'status', 'effective_status'];
    const keys = Object.keys(obj);

    // Sort keys to prioritize common fields
    keys.sort((a, b) => {
      const aIndex = priorityKeys.indexOf(a);
      const bIndex = priorityKeys.indexOf(b);
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return a.localeCompare(b);
    });

    // Take first 6 columns max
    return keys.slice(0, 6).map(key => ({
      key,
      header: this.formatHeader(key),
    }));
  }

  /**
   * Format a key as a header
   */
  private formatHeader(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  accountId?: string,
  pagination?: { has_next: boolean; cursor?: string }
): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      account_id: accountId,
      timestamp: new Date().toISOString(),
      pagination,
    },
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  retryAfter?: number
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      retry_after: retryAfter,
    },
  };
}
