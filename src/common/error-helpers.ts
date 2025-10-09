import type { ErrorResponse, MAXCLICKS_ERROR_CODE_KEY } from '../interfaces';

export function createErrorResponse(
  code: MAXCLICKS_ERROR_CODE_KEY,
  message: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    requestId: '',
    timestamp: new Date().toISOString(),
  };
}

export const ErrorHelpers = {
  validation(message: string, details?: Record<string, any>): ErrorResponse {
    return createErrorResponse('validation_error', message, details);
  },

  invalidParameter(parameter: string, expected?: string): ErrorResponse {
    return createErrorResponse(
      'invalid_parameter',
      `Invalid parameter '${parameter}'${expected ? `. Expected: ${expected}` : ''}.`
    );
  },

  notFound(resource: string, id?: string): ErrorResponse {
    return createErrorResponse('not_found', `${resource}${id ? ` with id ${id}` : ''} not found.`);
  },

  invalidApiKey(): ErrorResponse {
    return createErrorResponse('invalid_api_key', 'API key is invalid.');
  },

  rateLimitExceeded(): ErrorResponse {
    return createErrorResponse('rate_limit_exceeded', 'Rate limit exceeded.');
  },

  internalServer(message = 'Something went wrong.'): ErrorResponse {
    return createErrorResponse('internal_server_error', message);
  },

  serviceUnavailable(message = 'Service temporarily unavailable.'): ErrorResponse {
    return createErrorResponse('service_unavailable', message);
  },
};
