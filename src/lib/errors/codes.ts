export enum ErrorCode {
  // Authentication (AUTH_xxx)
  AUTH_NOT_CONFIGURED = 'AUTH_NOT_CONFIGURED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Rate Limiting (RATE_xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Validation (VAL_xxx)
  INVALID_ACCOUNT_ID = 'INVALID_ACCOUNT_ID',
  INVALID_CAMPAIGN_ID = 'INVALID_CAMPAIGN_ID',
  INVALID_ADSET_ID = 'INVALID_ADSET_ID',
  INVALID_AD_ID = 'INVALID_AD_ID',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // API Errors (API_xxx)
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
  OPERATION_FAILED = 'OPERATION_FAILED',
  API_VERSION_DEPRECATED = 'API_VERSION_DEPRECATED',
  API_ERROR = 'API_ERROR',

  // Network (NET_xxx)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Configuration (CFG_xxx)
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorMessage {
  message: string;
  suggestion?: string;
}

export const ErrorMessages: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.AUTH_NOT_CONFIGURED]: {
    message: 'No access token configured.',
    suggestion: 'Run `meta-ads auth login` to authenticate.',
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    message: 'Your access token has expired.',
    suggestion: 'Run `meta-ads auth login` to authenticate with a new token.',
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    message: 'Your access token is invalid.',
    suggestion: 'Check your token and run `meta-ads auth login` to re-authenticate.',
  },
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: {
    message: 'Your access token lacks required permissions.',
    suggestion: 'Ensure your token has ads_management, ads_read, and business_management permissions.',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    message: 'Rate limit exceeded. Too many requests to Meta API.',
    suggestion: 'Wait before retrying. Check the retry_after value.',
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    message: 'API quota exceeded for this account.',
    suggestion: 'Wait for the quota to reset or contact Meta support.',
  },
  [ErrorCode.INVALID_ACCOUNT_ID]: {
    message: 'Invalid ad account ID format.',
    suggestion: 'Account IDs should start with "act_" followed by numbers.',
  },
  [ErrorCode.INVALID_CAMPAIGN_ID]: {
    message: 'Invalid campaign ID.',
    suggestion: 'Verify the campaign ID exists and you have access to it.',
  },
  [ErrorCode.INVALID_ADSET_ID]: {
    message: 'Invalid ad set ID.',
    suggestion: 'Verify the ad set ID exists and you have access to it.',
  },
  [ErrorCode.INVALID_AD_ID]: {
    message: 'Invalid ad ID.',
    suggestion: 'Verify the ad ID exists and you have access to it.',
  },
  [ErrorCode.INVALID_PARAMETER]: {
    message: 'Invalid parameter value.',
    suggestion: 'Check the parameter format and allowed values.',
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    message: 'Missing required field.',
    suggestion: 'Provide all required fields for this operation.',
  },
  [ErrorCode.ENTITY_NOT_FOUND]: {
    message: 'The requested entity was not found.',
    suggestion: 'Verify the ID is correct and you have access to it.',
  },
  [ErrorCode.DUPLICATE_ENTITY]: {
    message: 'An entity with this name already exists.',
    suggestion: 'Use a unique name for the new entity.',
  },
  [ErrorCode.OPERATION_FAILED]: {
    message: 'The operation failed.',
    suggestion: 'Check the error details and try again.',
  },
  [ErrorCode.API_VERSION_DEPRECATED]: {
    message: 'The API version is deprecated.',
    suggestion: 'Update to a newer API version.',
  },
  [ErrorCode.API_ERROR]: {
    message: 'Meta API returned an error.',
    suggestion: 'Check the error details for more information.',
  },
  [ErrorCode.NETWORK_ERROR]: {
    message: 'Network error occurred.',
    suggestion: 'Check your internet connection and try again.',
  },
  [ErrorCode.TIMEOUT]: {
    message: 'Request timed out.',
    suggestion: 'Try again or check your network connection.',
  },
  [ErrorCode.CONFIG_NOT_FOUND]: {
    message: 'Configuration not found.',
    suggestion: 'Run `meta-ads config set` to configure.',
  },
  [ErrorCode.INVALID_CONFIG]: {
    message: 'Invalid configuration.',
    suggestion: 'Check your configuration values.',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    message: 'An unexpected error occurred.',
    suggestion: 'Check the error details and try again.',
  },
};
