import { ErrorCode, ErrorMessages } from './codes.js';
import type { ErrorResponse } from '../../types/index.js';

export class CliError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly retryAfter?: number;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    retryAfter?: number
  ) {
    const errorMessage = ErrorMessages[code];
    super(message || errorMessage.message);
    this.name = 'CliError';
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }

  toResponse(): ErrorResponse {
    const errorMessage = ErrorMessages[this.code];
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        retryable: errorMessage.retryable,
        details: {
          ...this.details,
          suggestion: errorMessage.suggestion,
        },
        retry_after: this.retryAfter,
      },
    };
  }
}

export function handleMetaApiError(error: unknown): CliError {
  // Handle facebook-nodejs-business-sdk errors
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as {
      response?: {
        error?: {
          message?: string;
          code?: number;
          error_subcode?: number;
          type?: string;
          fbtrace_id?: string;
        };
      };
    };

    const metaError = apiError.response?.error;

    if (metaError) {
      const code = metaError.code;
      const subcode = metaError.error_subcode;

      // Map Meta error codes to our error codes
      if (code === 190) {
        // OAuth errors
        if (subcode === 463 || subcode === 467) {
          return new CliError(ErrorCode.AUTH_TOKEN_EXPIRED, metaError.message);
        }
        return new CliError(ErrorCode.AUTH_TOKEN_INVALID, metaError.message);
      }

      if (code === 200 || code === 294) {
        return new CliError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, metaError.message);
      }

      if (code === 4 || code === 17 || code === 32 || code === 613) {
        // Rate limiting
        return new CliError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          metaError.message,
          { fbtrace_id: metaError.fbtrace_id },
          60 // Default retry after 60 seconds
        );
      }

      if (code === 100) {
        // Invalid parameter
        if (metaError.message?.includes('not found')) {
          return new CliError(ErrorCode.ENTITY_NOT_FOUND, metaError.message);
        }
        return new CliError(ErrorCode.INVALID_PARAMETER, metaError.message);
      }

      // Generic API error
      return new CliError(ErrorCode.API_ERROR, metaError.message, {
        meta_code: code,
        meta_subcode: subcode,
        meta_type: metaError.type,
        fbtrace_id: metaError.fbtrace_id,
      });
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      return new CliError(ErrorCode.NETWORK_ERROR, error.message);
    }
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return new CliError(ErrorCode.TIMEOUT, error.message);
    }
  }

  // Unknown error
  return new CliError(
    ErrorCode.UNKNOWN_ERROR,
    error instanceof Error ? error.message : String(error),
    { original: String(error) }
  );
}

export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError;
}
