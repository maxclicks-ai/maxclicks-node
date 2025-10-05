import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Maxclicks } from '../maxclicks';
import type { ApiKeyCheck } from './interfaces/api-key';
import type { ErrorResponse } from '../interfaces';

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const mockSuccessResponse = (data: any, status = 200) => {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ success: true, data }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

const mockErrorResponse = (error: ErrorResponse, status = 422) => {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(error),
    json: async () => error,
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

describe('ApiKeys', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockReset();
    maxclicks = new Maxclicks('max_test_key_123');
  });

  describe('check', () => {
    it('should validate API key successfully and return space information', async () => {
      const mockResponse: ApiKeyCheck = {
        success: true,
        spaceName: 'My Test Space',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.apiKeys.check();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/misc/api-key/check'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );

      // Verify the Authorization header is set
      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer max_test_key_123');
      expect(headers.get('Content-Type')).toBe('application/json');

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.success).toBe(true);
      expect(result.data?.spaceName).toBe('My Test Space');
    });

    it('should handle invalid API key', async () => {
      const mockResponse: ApiKeyCheck = {
        success: false,
      };

      // When the API key is invalid, the endpoint returns 200 with success: false
      mockSuccessResponse(mockResponse);

      const result = await maxclicks.apiKeys.check();

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.success).toBe(false);
      expect(result.data?.spaceName).toBeUndefined();
    });

    it('should handle unauthorized request (401)', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'invalid_api_key',
          message: 'Invalid API key provided',
        },
        requestId: 'req_invalid',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 401);

      const result = await maxclicks.apiKeys.check();

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle missing API key error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'missing_api_key',
          message: 'API key is missing from the request',
        },
        requestId: 'req_missing',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 401);

      const result = await maxclicks.apiKeys.check();

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle rate limiting', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'rate_limit_exceeded',
          message: 'Rate limit exceeded. Please try again later.',
        },
        requestId: 'req_rate_limit',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 429);

      const result = await maxclicks.apiKeys.check();

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle server errors', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'internal_server_error',
          message: 'Internal server error occurred',
        },
        requestId: 'req_internal',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 500);

      const result = await maxclicks.apiKeys.check();

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.apiKeys.check();

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
      expect(result.error?.error.message).toBe(
        'Unable to fetch data. The request could not be resolved.'
      );
    });

    it('should handle malformed JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'invalid json',
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await maxclicks.apiKeys.check();

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
      expect(result.error?.error.message).toBe(
        'Internal server error. We are unable to process your request right now, please try again later.'
      );
    });
  });
});
